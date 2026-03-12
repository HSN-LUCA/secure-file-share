# ⚡ GitHub Quick Start - 5 Minutes

Fast track to push your code to GitHub.

---

## 🎯 The 5-Minute Process

### 1. Create Repository (1 min)

Go to https://github.com/new

```
Name: secure-file-share
Visibility: Public
Click: Create repository
```

Copy the URL shown (e.g., `https://github.com/YOUR-USERNAME/secure-file-share.git`)

---

### 2. Push Your Code (4 min)

Run these commands in your project directory:

```bash
# Navigate to project
cd secure-file-share

# Initialize git
git init

# Add all files
git add .

# Create commit
git commit -m "Initial commit: Secure File Share application"

# Add remote (replace YOUR-USERNAME)
git remote add origin https://github.com/HSN-LUCA/secure-file-share.git

# Rename branch
git branch -M main

# Push to GitHub
git push -u origin main
```

**When prompted for password**: Use your GitHub Personal Access Token (see below)

---

## 🔑 Get Personal Access Token (If Needed)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `secure-file-share`
4. Check: `repo` and `workflow`
5. Click **Generate token**
6. Copy token (you'll use it as password)

---

## ✅ Verify

Visit: https://github.com/YOUR-USERNAME/secure-file-share

You should see all your code!

---

## 🚀 Done!

Your code is now on GitHub. You can:
- Share the link with others
- Deploy from GitHub
- Collaborate with team
- Track changes with git

---

## 📝 Common Commands

```bash
# Check status
git status

# See what changed
git diff

# View history
git log --oneline

# Make changes and push
git add .
git commit -m "Your message"
git push
```

---

## 🆘 Troubleshooting

**Authentication failed?**
- Use Personal Access Token as password
- Or set up SSH keys

**Push rejected?**
- Check branch protection in Settings
- Try different branch name

**Large files?**
- Remove from git: `git rm --cached filename`
- Add to .gitignore
- Commit and push

---

## 📚 Full Guide

For detailed instructions, see: `SETUP_GUIDE.md`

---

**Time**: 5 minutes  
**Status**: ✅ Ready to go  
**Next**: Share your GitHub link!

🎉 You're done!
