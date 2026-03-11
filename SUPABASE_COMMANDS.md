# Supabase Setup - Command Reference

Quick reference for all commands you'll need.

## 🚀 Getting Started Commands

### Create .env.local from template
```bash
cp .env.example .env.local
```

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm run dev
```

Then open: http://localhost:3000

---

## 🗄️ Database Commands

### Initialize database schema
```bash
npm run db:setup
```

### Check database health
```bash
npm run db:health-check
```

### Get pool statistics
```bash
npm run db:stats
```

### Reset connection pool
```bash
npm run db:reset
```

---

## 🔐 Security Commands

### Generate encryption key
```bash
npm run storage:generate-key
```

Copy the output to `ENCRYPTION_KEY` in `.env.local`

### Generate JWT secret
```bash
openssl rand -base64 32
```

Copy the output to `JWT_SECRET` in `.env.local`

---

## 🧪 Testing Commands

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- path/to/test.ts
```

### Run property-based tests
```bash
npm run test:pbt
```

---

## 📦 Build Commands

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Check for TypeScript errors
```bash
npm run type-check
```

### Lint code
```bash
npm run lint
```

### Format code
```bash
npm run format
```

---

## 🔍 Debugging Commands

### Check environment variables
```bash
npm run env:validate
```

### View database logs
```bash
npm run db:logs
```

### Monitor database connections
```bash
npm run db:monitor
```

---

## 📝 Development Commands

### Start dev server on different port
```bash
npm run dev -- -p 3001
```

### Start dev server with debug logging
```bash
DEBUG=* npm run dev
```

### Clean build artifacts
```bash
npm run clean
```

### Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Deployment Commands

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Export static site (if applicable)
```bash
npm run export
```

---

## 🔧 Utility Commands

### Generate icons for PWA
```bash
npm run scripts:generate-icons
```

### Setup storage (AWS S3/Cloudflare R2)
```bash
npm run storage:setup
```

### Validate configuration
```bash
npm run env:validate
```

---

## 📊 Monitoring Commands

### View application logs
```bash
npm run logs
```

### Monitor performance
```bash
npm run perf:monitor
```

### Check bundle size
```bash
npm run analyze
```

---

## 🐛 Troubleshooting Commands

### Clear Next.js cache
```bash
rm -rf .next
npm run dev
```

### Clear all caches
```bash
npm run clean
npm install
npm run dev
```

### Check for dependency issues
```bash
npm audit
```

### Fix dependency issues
```bash
npm audit fix
```

### Update dependencies
```bash
npm update
```

---

## 📚 Documentation Commands

### View help
```bash
npm run help
```

### View available scripts
```bash
npm run
```

---

## 🔑 Environment Setup Quick Commands

### Copy environment template
```bash
cp .env.example .env.local
```

### Edit environment file (macOS/Linux)
```bash
nano .env.local
```

### Edit environment file (Windows)
```bash
notepad .env.local
```

### View environment file (macOS/Linux)
```bash
cat .env.local
```

### View environment file (Windows)
```bash
type .env.local
```

---

## 🗄️ Supabase CLI Commands (Optional)

If you have Supabase CLI installed:

### Login to Supabase
```bash
supabase login
```

### Link project
```bash
supabase link --project-ref your-project-id
```

### Pull remote schema
```bash
supabase db pull
```

### Push local migrations
```bash
supabase db push
```

### Start local Supabase
```bash
supabase start
```

### Stop local Supabase
```bash
supabase stop
```

---

## 🔄 Git Commands

### Check git status
```bash
git status
```

### Add changes
```bash
git add .
```

### Commit changes
```bash
git commit -m "Your message"
```

### Push to remote
```bash
git push
```

### View git log
```bash
git log --oneline
```

---

## 📋 Complete Setup Sequence

Run these commands in order to set up everything:

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Edit .env.local with your Supabase credentials
# (Use your editor: nano, vim, code, etc.)

# 3. Install dependencies
npm install

# 4. Initialize database
npm run db:setup

# 5. Check database health
npm run db:health-check

# 6. Start development server
npm run dev

# 7. Open in browser
# http://localhost:3000
```

---

## 🆘 Emergency Commands

### Kill process on port 3000 (macOS/Linux)
```bash
lsof -ti:3000 | xargs kill -9
```

### Kill process on port 3000 (Windows)
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Reset everything
```bash
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run db:setup
npm run dev
```

### View running processes
```bash
ps aux | grep node
```

---

## 📞 Help Commands

### View npm scripts
```bash
npm run
```

### View package.json scripts
```bash
cat package.json | grep -A 50 '"scripts"'
```

### Get help for a command
```bash
npm run <command> -- --help
```

---

## 🎯 Common Workflows

### Daily Development
```bash
npm run dev
# Make changes
# Test in browser
# Commit changes
```

### Before Committing
```bash
npm run lint
npm run type-check
npm test
git add .
git commit -m "Your message"
```

### Before Deploying
```bash
npm run lint
npm run type-check
npm test
npm run build
npm start
```

### Debugging Issues
```bash
npm run db:health-check
npm run env:validate
npm run clean
npm install
npm run dev
```

---

## 💡 Pro Tips

### Use npm scripts for everything
```bash
# Instead of: node lib/db/setup.ts
# Use: npm run db:setup
```

### Check available scripts
```bash
npm run
# Shows all available commands
```

### Use environment variables
```bash
# Instead of hardcoding values
# Use: process.env.VARIABLE_NAME
```

### Keep .env.local secure
```bash
# Make sure it's in .gitignore
grep ".env.local" .gitignore
```

### Use version control
```bash
# Commit often
git add .
git commit -m "Descriptive message"
git push
```

---

## 📚 Related Documentation

- [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) - Quick checklist
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Detailed guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database details
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables
- [STORAGE_SETUP.md](./STORAGE_SETUP.md) - AWS S3 setup

---

## 🚀 Ready to Go!

You now have all the commands you need. Start with:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000 in your browser!
