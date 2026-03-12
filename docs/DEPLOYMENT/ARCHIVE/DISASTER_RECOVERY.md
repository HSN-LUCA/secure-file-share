# Disaster Recovery Plan

## Executive Summary

This document outlines the disaster recovery procedures for Secure File Share, including backup strategies, recovery procedures, and testing protocols.

## 1. Recovery Objectives

### RTO (Recovery Time Objective)

| Component | RTO | Priority |
|-----------|-----|----------|
| API Service | 5 minutes | Critical |
| Database | 15 minutes | Critical |
| File Storage | 1 hour | High |
| Analytics | 4 hours | Medium |

### RPO (Recovery Point Objective)

| Component | RPO | Frequency |
|-----------|-----|-----------|
| Database | 5 minutes | Continuous replication |
| File Storage | 15 minutes | Cross-region replication |
| Configuration | 1 hour | Version control |
| Logs | 24 hours | Daily export |

## 2. Backup Strategy

### Database Backups

**Automated Snapshots:**
```bash
# Daily automated snapshots (retention: 30 days)
aws rds modify-db-instance \
  --db-instance-identifier secure-file-share-primary \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

**Point-in-Time Recovery:**
- Enabled via transaction logs
- Retention: 7 days
- Allows recovery to any point within 7 days

**Backup Verification:**
```bash
# List recent snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier secure-file-share-primary \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

### File Storage Backups

**S3 Versioning:**
```bash
# Enable versioning on all buckets
aws s3api put-bucket-versioning \
  --bucket secure-file-share-us-east \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning \
  --bucket secure-file-share-eu-west \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-versioning \
  --bucket secure-file-share-apac \
  --versioning-configuration Status=Enabled
```

**Cross-Region Replication:**
- Automatic replication to secondary regions
- Replication time: < 15 minutes
- Includes all versions

**Backup Verification:**
```bash
# Check replication status
aws s3api get-bucket-replication \
  --bucket secure-file-share-us-east

# List object versions
aws s3api list-object-versions \
  --bucket secure-file-share-us-east \
  --max-items 10
```

### Configuration Backups

**Git Repository:**
- All code and configuration in version control
- Daily automated backups to GitHub
- Tag releases for easy rollback

**Environment Variables:**
```bash
# Backup to encrypted S3
aws s3 cp .env.production \
  s3://secure-file-share-backups/env/$(date +%Y%m%d).env.enc \
  --sse aws:kms \
  --sse-kms-key-id arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID
```

## 3. Disaster Scenarios and Recovery

### Scenario 1: Database Corruption

**Detection:**
- Automated health checks fail
- Query errors in logs
- Replication lag increases

**Recovery Steps:**

1. **Immediate Actions (0-5 min)**
   ```bash
   # Promote read replica to standalone
   aws rds promote-read-replica \
     --db-instance-identifier secure-file-share-eu-west-replica
   
   # Update application to use new database
   # Update DATABASE_URL environment variable
   ```

2. **Restore from Snapshot (5-15 min)**
   ```bash
   # Find latest good snapshot
   SNAPSHOT_ID=$(aws rds describe-db-snapshots \
     --db-instance-identifier secure-file-share-primary \
     --query 'DBSnapshots[0].DBSnapshotIdentifier' \
     --output text)
   
   # Restore to new instance
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier secure-file-share-restored \
     --db-snapshot-identifier $SNAPSHOT_ID \
     --db-instance-class db.t3.micro
   ```

3. **Verification (15-20 min)**
   ```bash
   # Check data integrity
   psql -h restored-db.rds.amazonaws.com -U admin -d secure_file_share \
     -c "SELECT COUNT(*) FROM files; SELECT COUNT(*) FROM users;"
   
   # Run consistency checks
   psql -h restored-db.rds.amazonaws.com -U admin -d secure_file_share \
     -c "SELECT COUNT(*) FROM files WHERE expires_at < NOW();"
   ```

4. **Cutover (20-25 min)**
   ```bash
   # Update DNS/connection strings
   # Monitor error rates
   # Verify all services operational
   ```

### Scenario 2: S3 Data Loss

**Detection:**
- Download failures
- File not found errors
- Replication lag detected

**Recovery Steps:**

1. **Immediate Actions (0-5 min)**
   ```bash
   # Check if file exists in secondary region
   aws s3 ls s3://secure-file-share-eu-west/path/to/file \
     --region eu-west-1
   
   # If found, copy back to primary
   aws s3 cp s3://secure-file-share-eu-west/path/to/file \
     s3://secure-file-share-us-east/path/to/file \
     --copy-props none
   ```

2. **Restore from Version (5-15 min)**
   ```bash
   # List object versions
   aws s3api list-object-versions \
     --bucket secure-file-share-us-east \
     --prefix path/to/file
   
   # Restore specific version
   aws s3api get-object \
     --bucket secure-file-share-us-east \
     --key path/to/file \
     --version-id VERSION_ID \
     restored-file
   
   # Upload restored file
   aws s3 cp restored-file \
     s3://secure-file-share-us-east/path/to/file
   ```

3. **Verification (15-20 min)**
   ```bash
   # Verify file integrity
   aws s3api head-object \
     --bucket secure-file-share-us-east \
     --key path/to/file
   
   # Test download
   curl -I https://d123456.cloudfront.net/path/to/file
   ```

### Scenario 3: Complete Region Failure

**Detection:**
- Health checks fail for entire region
- Multiple service errors
- CloudWatch alarms triggered

**Recovery Steps:**

1. **Immediate Actions (0-2 min)**
   ```bash
   # Route 53 automatically fails over to secondary region
   # Verify failover occurred
   aws route53 list-resource-record-sets \
     --hosted-zone-id ZONE_ID \
     --query 'ResourceRecordSets[?Name==`api.secure-file-share.com`]'
   ```

2. **Promote Secondary Region (2-5 min)**
   ```bash
   # Promote EU West read replica to primary
   aws rds promote-read-replica \
     --db-instance-identifier secure-file-share-eu-west-replica \
     --region eu-west-1
   
   # Update replication to APAC
   aws rds create-db-instance-read-replica \
     --db-instance-identifier secure-file-share-eu-west-replica-apac \
     --source-db-instance-identifier secure-file-share-eu-west-replica \
     --db-instance-class db.t3.micro \
     --region ap-southeast-1
   ```

3. **Verify Services (5-10 min)**
   ```bash
   # Check API health
   curl https://api.secure-file-share.com/api/health
   
   # Verify file downloads
   curl https://d123456.cloudfront.net/test-file
   
   # Check database connectivity
   psql -h eu-west-db.rds.eu-west-1.amazonaws.com -U admin -d secure_file_share \
     -c "SELECT 1;"
   ```

4. **Restore Primary Region (1-4 hours)**
   ```bash
   # Once primary region is back online
   # Create new read replica in US East
   aws rds create-db-instance-read-replica \
     --db-instance-identifier secure-file-share-us-east-replica \
     --source-db-instance-identifier secure-file-share-eu-west-replica \
     --db-instance-class db.t3.micro \
     --region us-east-1
   
   # Failback to primary region
   # Update Route 53 routing policy
   ```

### Scenario 4: Application Code Corruption

**Detection:**
- Deployment errors
- Runtime exceptions
- Service unavailable

**Recovery Steps:**

1. **Immediate Rollback (0-5 min)**
   ```bash
   # Revert to previous deployment
   git revert HEAD
   git push origin main
   
   # Vercel automatically redeploys
   # Or manually trigger:
   vercel --prod
   ```

2. **Verify Rollback (5-10 min)**
   ```bash
   # Check deployment status
   vercel ls
   
   # Test critical endpoints
   curl https://api.secure-file-share.com/api/upload
   curl https://api.secure-file-share.com/api/download/123456
   ```

3. **Investigate Issue (10+ min)**
   ```bash
   # Check logs
   vercel logs
   
   # Review recent changes
   git log --oneline -10
   
   # Fix and redeploy
   git commit -am "Fix: issue description"
   git push origin main
   ```

## 4. Backup Verification

### Automated Verification

```typescript
// scripts/verify-backups.ts
import { RDSClient, DescribeDBSnapshotsCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

async function verifyBackups() {
  const rds = new RDSClient({ region: 'us-east-1' });
  const s3 = new S3Client({ region: 'us-east-1' });

  // Check database snapshots
  const snapshots = await rds.send(new DescribeDBSnapshotsCommand({
    DBInstanceIdentifier: 'secure-file-share-primary',
  }));

  const latestSnapshot = snapshots.DBSnapshots?.[0];
  if (!latestSnapshot) {
    throw new Error('No database snapshots found');
  }

  const snapshotAge = Date.now() - (latestSnapshot.SnapshotCreateTime?.getTime() || 0);
  if (snapshotAge > 86400000) { // 24 hours
    throw new Error('Latest snapshot is older than 24 hours');
  }

  console.log('✓ Database backup verified');

  // Check S3 versioning
  const buckets = ['secure-file-share-us-east', 'secure-file-share-eu-west', 'secure-file-share-apac'];
  for (const bucket of buckets) {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✓ S3 bucket ${bucket} verified`);
  }
}

verifyBackups().catch(console.error);
```

### Manual Verification Checklist

- [ ] Database snapshots exist and are recent (< 24 hours)
- [ ] S3 versioning enabled on all buckets
- [ ] Cross-region replication active
- [ ] Read replicas in secondary regions
- [ ] Health checks passing in all regions
- [ ] DNS failover configured
- [ ] Backup encryption keys accessible
- [ ] IAM roles and permissions correct

## 5. Disaster Recovery Testing

### Monthly DR Test

**Schedule:** First Friday of each month, 2:00 AM UTC

**Procedure:**

1. **Pre-Test (1 day before)**
   - Notify team
   - Prepare test environment
   - Document baseline metrics

2. **Test Execution (30 minutes)**
   ```bash
   # Simulate database failure
   aws rds reboot-db-instance \
     --db-instance-identifier secure-file-share-primary \
     --force-failover
   
   # Monitor failover
   watch -n 5 'aws route53 get-health-check-status \
     --health-check-id HEALTH_CHECK_ID'
   
   # Verify secondary region operational
   curl https://api.secure-file-share.com/api/health
   ```

3. **Post-Test (30 minutes)**
   - Document results
   - Identify issues
   - Update procedures
   - Failback to primary

4. **Report**
   - RTO achieved: _____ minutes
   - RPO achieved: _____ minutes
   - Issues encountered: _____
   - Improvements needed: _____

### Annual DR Drill

**Full system recovery test:**
- Restore database from backup
- Restore files from S3 versions
- Deploy application from Git
- Verify all functionality
- Document lessons learned

## 6. Communication Plan

### Incident Notification

**Severity Levels:**

| Level | RTO | Notification |
|-------|-----|--------------|
| Critical | 5 min | All hands |
| High | 30 min | Engineering team |
| Medium | 2 hours | On-call engineer |
| Low | 24 hours | Ticket system |

**Notification Channels:**
- Slack: #incidents
- Email: incidents@secure-file-share.com
- PagerDuty: On-call rotation
- Status Page: status.secure-file-share.com

### Status Updates

- Initial notification: Within 5 minutes
- Updates: Every 15 minutes during incident
- Resolution: Within 1 hour
- Post-mortem: Within 24 hours

## 7. Runbooks

### Database Recovery Runbook

```
1. Detect Issue
   - Check CloudWatch alarms
   - Verify database connectivity
   - Check replication lag

2. Assess Severity
   - Is data corrupted?
   - Can we use read replica?
   - Do we need to restore from snapshot?

3. Execute Recovery
   - Promote read replica OR
   - Restore from snapshot

4. Verify
   - Run consistency checks
   - Test critical queries
   - Monitor error rates

5. Communicate
   - Update status page
   - Notify stakeholders
   - Document incident
```

### S3 Recovery Runbook

```
1. Detect Issue
   - Check S3 access logs
   - Verify object exists
   - Check replication status

2. Assess Severity
   - Is file deleted?
   - Is file corrupted?
   - Is replication working?

3. Execute Recovery
   - Restore from version OR
   - Copy from secondary region

4. Verify
   - Check file integrity
   - Test download
   - Verify metadata

5. Communicate
   - Update status page
   - Notify affected users
   - Document incident
```

## 8. Maintenance Windows

**Scheduled Maintenance:**
- Frequency: Monthly
- Duration: 2 hours
- Window: First Sunday, 2:00-4:00 AM UTC
- Activities:
  - Database maintenance
  - Security patches
  - Backup verification
  - DR test

**Maintenance Notification:**
- Announced 2 weeks in advance
- Status page updated
- Email notification sent
- Slack announcement

## 9. Compliance and Auditing

### Backup Compliance

- [ ] Backups encrypted at rest
- [ ] Backups encrypted in transit
- [ ] Backup access logged
- [ ] Backup retention policy enforced
- [ ] Backup integrity verified

### Audit Trail

```sql
-- Query backup events
SELECT * FROM audit_log 
WHERE event_type IN ('backup_created', 'backup_restored', 'backup_deleted')
ORDER BY created_at DESC;
```

### Compliance Reports

- Monthly: Backup verification report
- Quarterly: DR test results
- Annually: Compliance audit

## 10. Contacts and Escalation

### On-Call Rotation

- Primary: [Name] - [Phone]
- Secondary: [Name] - [Phone]
- Manager: [Name] - [Phone]

### Escalation Path

1. On-call engineer (5 min)
2. Engineering manager (15 min)
3. VP Engineering (30 min)
4. CTO (1 hour)

### External Contacts

- AWS Support: [Account ID]
- Database Vendor: [Support ID]
- CDN Provider: [Account ID]

## Conclusion

This disaster recovery plan ensures:
- **Rapid Recovery**: RTO/RPO targets met
- **Data Protection**: Multiple backup strategies
- **Verified Procedures**: Regular testing
- **Clear Communication**: Incident response plan
- **Continuous Improvement**: Lessons learned process
