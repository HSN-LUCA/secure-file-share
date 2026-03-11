# Multi-Region Deployment Guide

## Overview

This guide covers deploying Secure File Share across multiple AWS regions for global availability, low latency, and disaster recovery.

## Supported Regions

- **US East (N. Virginia)** - Primary region
- **EU West (Ireland)** - European region
- **Asia Pacific (Singapore)** - APAC region

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront CDN                           │
│              (Global Edge Locations)                        │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
        ┌──────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
        │   US East   │ │ EU West   │ │ APAC      │
        │  (Primary)  │ │(Secondary)│ │(Secondary)│
        ├─────────────┤ ├───────────┤ ├───────────┤
        │ - App       │ │ - App     │ │ - App     │
        │ - DB Read   │ │ - DB Read │ │ - DB Read │
        │ - S3        │ │ - S3      │ │ - S3      │
        └─────────────┘ └───────────┘ └───────────┘
               │              │              │
               └──────────────┼──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Primary Database │
                    │  (US East)        │
                    │  - Master         │
                    │  - Replication    │
                    └───────────────────┘
```

## 1. Database Replication Setup

### Primary Database (US East)

```sql
-- Enable logical replication on primary
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;

-- Restart PostgreSQL
SELECT pg_ctl_restart();

-- Create replication slot
SELECT * FROM pg_create_logical_replication_slot('us_east_slot', 'test_decoding');
```

### Read Replicas

**EU West Read Replica:**
```bash
# Create read replica in EU West
aws rds create-db-instance-read-replica \
  --db-instance-identifier secure-file-share-eu-west-replica \
  --source-db-instance-identifier secure-file-share-primary \
  --db-instance-class db.t3.micro \
  --region eu-west-1 \
  --publicly-accessible false
```

**APAC Read Replica:**
```bash
# Create read replica in APAC
aws rds create-db-instance-read-replica \
  --db-instance-identifier secure-file-share-apac-replica \
  --source-db-instance-identifier secure-file-share-primary \
  --db-instance-class db.t3.micro \
  --region ap-southeast-1 \
  --publicly-accessible false
```

### Replication Monitoring

```sql
-- Check replication status
SELECT slot_name, slot_type, active FROM pg_replication_slots;

-- Monitor replication lag
SELECT 
  client_addr,
  state,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;
```

## 2. S3 Cross-Region Replication

### Enable Versioning

```bash
# Enable versioning on primary bucket
aws s3api put-bucket-versioning \
  --bucket secure-file-share-us-east \
  --versioning-configuration Status=Enabled \
  --region us-east-1
```

### Configure Replication

```bash
# Create replication configuration
cat > replication.json << 'EOF'
{
  "Role": "arn:aws:iam::ACCOUNT_ID:role/s3-replication-role",
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": ""
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::secure-file-share-eu-west",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        },
        "Metrics": {
          "Status": "Enabled",
          "EventThreshold": {
            "Minutes": 15
          }
        }
      }
    },
    {
      "Status": "Enabled",
      "Priority": 2,
      "Filter": {
        "Prefix": ""
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::secure-file-share-apac",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        }
      }
    }
  ]
}
EOF

# Apply replication configuration
aws s3api put-bucket-replication \
  --bucket secure-file-share-us-east \
  --replication-configuration file://replication.json \
  --region us-east-1
```

## 3. CloudFront CDN Configuration

### Create CloudFront Distribution

```bash
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "secure-file-share-$(date +%s)",
  "Comment": "Secure File Share CDN",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 3,
    "Items": [
      {
        "Id": "us-east-origin",
        "DomainName": "secure-file-share-us-east.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      },
      {
        "Id": "eu-west-origin",
        "DomainName": "secure-file-share-eu-west.s3.eu-west-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      },
      {
        "Id": "apac-origin",
        "DomainName": "secure-file-share-apac.s3.ap-southeast-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "us-east-origin",
    "ViewerProtocolPolicy": "https-only",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Enabled": true
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## 4. Geo-Routing Implementation

### Route 53 Geolocation Routing

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name secure-file-share.com \
  --caller-reference $(date +%s)

# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name secure-file-share.com \
  --query 'HostedZones[0].Id' \
  --output text)

# Create geolocation records
cat > geo-routing.json << 'EOF'
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.secure-file-share.com",
        "Type": "A",
        "SetIdentifier": "US-East",
        "GeoLocation": {
          "CountryCode": "US"
        },
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "us-east-alb.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.secure-file-share.com",
        "Type": "A",
        "SetIdentifier": "EU-West",
        "GeoLocation": {
          "CountryCode": "IE"
        },
        "AliasTarget": {
          "HostedZoneId": "Z32O12XQLNTSW2",
          "DNSName": "eu-west-alb.elb.eu-west-1.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.secure-file-share.com",
        "Type": "A",
        "SetIdentifier": "APAC",
        "GeoLocation": {
          "CountryCode": "SG"
        },
        "AliasTarget": {
          "HostedZoneId": "Z1LMS91P8CMLE5",
          "DNSName": "apac-alb.elb.ap-southeast-1.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

# Apply routing policy
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://geo-routing.json
```

### Application-Level Geo-Routing

```typescript
// lib/geo-routing.ts
import { headers } from 'next/headers';

export function getRegionFromHeaders(): 'us-east' | 'eu-west' | 'apac' {
  const headersList = headers();
  const cloudflareCountry = headersList.get('cf-ipcountry');
  
  if (!cloudflareCountry) return 'us-east';
  
  // Map countries to regions
  const euCountries = ['IE', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'];
  const apacCountries = ['SG', 'JP', 'AU', 'NZ', 'IN', 'KR', 'CN', 'HK'];
  
  if (euCountries.includes(cloudflareCountry)) return 'eu-west';
  if (apacCountries.includes(cloudflareCountry)) return 'apac';
  
  return 'us-east';
}

export function getRegionDatabaseUrl(region: string): string {
  const urls: Record<string, string> = {
    'us-east': process.env.DATABASE_URL_US_EAST!,
    'eu-west': process.env.DATABASE_URL_EU_WEST!,
    'apac': process.env.DATABASE_URL_APAC!,
  };
  
  return urls[region] || urls['us-east'];
}

export function getRegionS3Bucket(region: string): string {
  const buckets: Record<string, string> = {
    'us-east': 'secure-file-share-us-east',
    'eu-west': 'secure-file-share-eu-west',
    'apac': 'secure-file-share-apac',
  };
  
  return buckets[region];
}
```

## 5. Failover Mechanisms

### Health Checks

```bash
# Create health check for US East
aws route53 create-health-check \
  --health-check-config \
    IPAddress=10.0.1.100,\
    Port=443,\
    Type=HTTPS,\
    ResourcePath=/api/health,\
    FullyQualifiedDomainName=us-east-alb.elb.amazonaws.com,\
    RequestInterval=30,\
    FailureThreshold=3

# Create health check for EU West
aws route53 create-health-check \
  --health-check-config \
    IPAddress=10.1.1.100,\
    Port=443,\
    Type=HTTPS,\
    ResourcePath=/api/health,\
    FullyQualifiedDomainName=eu-west-alb.elb.eu-west-1.amazonaws.com,\
    RequestInterval=30,\
    FailureThreshold=3

# Create health check for APAC
aws route53 create-health-check \
  --health-check-config \
    IPAddress=10.2.1.100,\
    Port=443,\
    Type=HTTPS,\
    ResourcePath=/api/health,\
    FullyQualifiedDomainName=apac-alb.elb.ap-southeast-1.amazonaws.com,\
    RequestInterval=30,\
    FailureThreshold=3
```

### Automatic Failover

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db/pool';

export async function GET() {
  try {
    // Check database connectivity
    const client = getClient();
    await client.query('SELECT 1');
    
    // Check S3 connectivity
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    await s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! }));
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        region: process.env.AWS_REGION,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

## 6. Region Health Monitoring

### CloudWatch Monitoring

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name SecureFileShareRegions \
  --dashboard-body file://dashboard-config.json

# Create alarms for each region
aws cloudwatch put-metric-alarm \
  --alarm-name us-east-high-latency \
  --alarm-description "Alert when US East latency is high" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Custom Metrics

```typescript
// lib/monitoring/region-health.ts
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export async function reportRegionHealth(region: string, metrics: {
  responseTime: number;
  errorRate: number;
  activeConnections: number;
}) {
  const cloudwatch = new CloudWatchClient({ region });
  
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'SecureFileShare',
    MetricData: [
      {
        MetricName: 'ResponseTime',
        Value: metrics.responseTime,
        Unit: 'Milliseconds',
        Dimensions: [{ Name: 'Region', Value: region }],
      },
      {
        MetricName: 'ErrorRate',
        Value: metrics.errorRate,
        Unit: 'Percent',
        Dimensions: [{ Name: 'Region', Value: region }],
      },
      {
        MetricName: 'ActiveConnections',
        Value: metrics.activeConnections,
        Unit: 'Count',
        Dimensions: [{ Name: 'Region', Value: region }],
      },
    ],
  }));
}
```

## 7. Disaster Recovery

### Backup Strategy

**Automated Backups:**
- Database: Daily snapshots, 30-day retention
- S3: Versioning enabled, cross-region replication
- Configuration: Version controlled in Git

**Backup Commands:**
```bash
# Create database snapshot
aws rds create-db-snapshot \
  --db-instance-identifier secure-file-share-primary \
  --db-snapshot-identifier secure-file-share-backup-$(date +%Y%m%d)

# Export snapshot to S3
aws rds start-export-task \
  --export-task-identifier secure-file-share-export-$(date +%Y%m%d) \
  --source-arn arn:aws:rds:us-east-1:ACCOUNT_ID:db:secure-file-share-primary \
  --s3-bucket-name secure-file-share-backups \
  --s3-prefix backups/ \
  --iam-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-export-role \
  --export-only []
```

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier secure-file-share-restored \
  --db-snapshot-identifier secure-file-share-backup-20240101

# Promote read replica to standalone
aws rds promote-read-replica \
  --db-instance-identifier secure-file-share-eu-west-replica
```

**S3 Recovery:**
```bash
# Restore deleted object
aws s3api get-object \
  --bucket secure-file-share-us-east \
  --key path/to/file \
  --version-id VERSION_ID \
  restored-file

# Restore from cross-region replica
aws s3 sync \
  s3://secure-file-share-eu-west \
  s3://secure-file-share-us-east \
  --region eu-west-1
```

### RTO/RPO Targets

| Component | RTO | RPO |
|-----------|-----|-----|
| Database | 15 minutes | 5 minutes |
| S3 Storage | 1 hour | 15 minutes |
| Application | 5 minutes | 0 minutes |
| DNS | 1 minute | 0 minutes |

## 8. Testing Failover

### Failover Test Procedure

1. **Preparation**
   - Schedule maintenance window
   - Notify users
   - Backup current state

2. **Failover Execution**
   ```bash
   # Simulate region failure
   aws route53 update-health-check \
     --health-check-id HEALTH_CHECK_ID \
     --alarm-identifier Region=us-east-1,Name=SimulatedFailure
   ```

3. **Verification**
   - Check traffic routing to secondary region
   - Verify data consistency
   - Monitor error rates

4. **Rollback**
   ```bash
   # Restore health check
   aws route53 update-health-check \
     --health-check-id HEALTH_CHECK_ID \
     --alarm-identifier Region=us-east-1,Name=ActualHealthCheck
   ```

## 9. Environment Variables

```bash
# Database URLs
DATABASE_URL_US_EAST=postgresql://user:pass@us-east-db.rds.amazonaws.com/secure_file_share
DATABASE_URL_EU_WEST=postgresql://user:pass@eu-west-db.rds.eu-west-1.amazonaws.com/secure_file_share
DATABASE_URL_APAC=postgresql://user:pass@apac-db.rds.ap-southeast-1.amazonaws.com/secure_file_share

# S3 Buckets
S3_BUCKET_US_EAST=secure-file-share-us-east
S3_BUCKET_EU_WEST=secure-file-share-eu-west
S3_BUCKET_APAC=secure-file-share-apac

# CloudFront
CLOUDFRONT_DOMAIN=d123456.cloudfront.net

# Regions
AWS_REGIONS=us-east-1,eu-west-1,ap-southeast-1
PRIMARY_REGION=us-east-1
```

## 10. Monitoring and Alerts

### Key Metrics to Monitor

- Replication lag (target: < 5 seconds)
- Cross-region failover time (target: < 1 minute)
- Data consistency across regions
- Regional error rates
- Regional latency

### Alert Thresholds

```yaml
Alerts:
  ReplicationLag:
    Threshold: 30 seconds
    Action: Page on-call engineer
  
  RegionalErrorRate:
    Threshold: 5%
    Action: Trigger failover
  
  RegionalLatency:
    Threshold: 2000ms
    Action: Investigate and scale
  
  FailoverTime:
    Threshold: 5 minutes
    Action: Page on-call engineer
```

## Conclusion

This multi-region deployment provides:
- **High Availability**: Automatic failover between regions
- **Low Latency**: Geo-routing to nearest region
- **Disaster Recovery**: Cross-region replication and backups
- **Scalability**: Independent scaling per region
- **Compliance**: Data residency in specified regions
