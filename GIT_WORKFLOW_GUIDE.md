# Git Workflow Guide - Local Development & Testing

## Overview

This guide walks you through safely developing, testing, and deploying changes using Git branches.

---

## Basic Workflow: Feature Branches

**Golden Rule:** Never commit directly to `main`. Always use feature branches.

```
main (production) ← Always stable, deployed to GitHub Pages
  ↑
  └── feature/commissioner-mode (your work)
```

---

## Step-by-Step Workflow

### 1. **Check Current Status**

Before starting work, see what's changed:

```bash
cd "/Users/joshuawein/Projects/Movie Draft"
git status
```

This shows:
- Modified files
- Untracked files
- Current branch

### 2. **Create a Feature Branch**

Create a new branch for your feature:

```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/commissioner-mode

# Or shorter:
git switch -c feature/commissioner-mode
```

**Branch naming conventions:**
- `feature/commissioner-mode` - New features
- `fix/pick-bug` - Bug fixes
- `refactor/state-management` - Code improvements

### 3. **Make Your Changes**

Edit files, add features, fix bugs as normal. Your IDE will show you what's changed.

### 4. **Test Locally**

Before committing, always test your changes:

#### A. **Test Dev Server**

```bash
cd movie-draft-app
npm run dev
```

Visit `http://localhost:5173` and test:
- [ ] App loads without errors
- [ ] New features work as expected
- [ ] Existing features still work
- [ ] No console errors

#### B. **Test Production Build**

This is critical - GitHub Pages serves the production build, not dev:

```bash
cd movie-draft-app

# Build the production version
npm run build

# Preview the production build locally
npm run preview
```

Visit `http://localhost:4173` (or whatever port it shows) and test:
- [ ] Production build works
- [ ] All assets load correctly
- [ ] No 404 errors
- [ ] Routes work (if you have any)

#### C. **Check for Linting Errors**

```bash
cd movie-draft-app
npm run lint
```

Fix any errors before committing.

### 5. **Stage Your Changes**

Once you're happy with your changes:

```bash
# See what changed
git status

# Stage specific files
git add movie-draft-app/src/components/NewComponent.jsx
git add movie-draft-app/src/hooks/useSession.js

# Or stage all changes
git add .
```

**Pro tip:** Review changes before staging:
```bash
git diff                    # See unstaged changes
git diff --staged          # See staged changes
```

### 6. **Commit Your Changes**

Write a clear commit message:

```bash
git commit -m "Add Firebase session management for commissioner mode

- Add useSession hook for session lifecycle
- Add Firebase initialization
- Add host/join session UI
- Update useDraftState to sync with Firebase"
```

**Commit message best practices:**
- First line: Short summary (50 chars or less)
- Blank line
- Body: Explain what and why (wrap at 72 chars)
- Use present tense: "Add feature" not "Added feature"

### 7. **Push Your Branch**

Push your branch to GitHub:

```bash
git push -u origin feature/commissioner-mode
```

The `-u` flag sets up tracking so future pushes are just `git push`.

### 8. **Test on GitHub (Optional but Recommended)**

If you want to test the build process before merging:

1. Go to your repo: `https://github.com/jwein/movie-draft`
2. You'll see a banner: "feature/commissioner-mode had recent pushes"
3. Click "Compare & pull request"
4. Create a draft PR (don't merge yet)
5. Check the GitHub Actions tab - the workflow will run
6. Verify the build succeeds

### 9. **Merge to Main**

Once everything is tested and working:

#### Option A: Merge via GitHub (Recommended)
1. Go to your PR on GitHub
2. Review the changes
3. Click "Merge pull request"
4. Delete the feature branch (GitHub will prompt you)

#### Option B: Merge Locally
```bash
# Switch back to main
git checkout main

# Pull latest changes (if working with others)
git pull origin main

# Merge your feature branch
git merge feature/commissioner-mode

# Push to GitHub
git push origin main

# Delete local branch (optional)
git branch -d feature/commissioner-mode
```

### 10. **Deploy to GitHub Pages**

After merging to main:
1. GitHub Actions will automatically run
2. Check the Actions tab to see the build progress
3. Once complete, your site updates at `https://jwein.github.io/movie-draft/`

---

## Common Scenarios

### Scenario 1: I Made Changes But Want to Start Over

```bash
# Discard all uncommitted changes
git checkout .

# Or discard specific file
git checkout -- path/to/file.jsx
```

### Scenario 2: I Committed But Want to Change the Message

```bash
# Edit the last commit message
git commit --amend -m "New commit message"

# If already pushed, you'll need to force push (be careful!)
git push --force-with-lease origin feature/commissioner-mode
```

### Scenario 3: I Want to Update My Branch with Latest Main

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Switch back to your branch
git checkout feature/commissioner-mode

# Merge main into your branch
git merge main

# Resolve any conflicts, then continue
git add .
git commit -m "Merge main into feature branch"
```

### Scenario 4: I Want to See What I Changed

```bash
# See all commits on your branch not in main
git log main..feature/commissioner-mode

# See what files changed
git diff main...feature/commissioner-mode --name-only

# See detailed diff
git diff main...feature/commissioner-mode
```

### Scenario 5: I Need to Test the Exact Production Build

```bash
cd movie-draft-app

# Build
npm run build

# Serve the dist folder (like GitHub Pages does)
# Option 1: Use Vite preview
npm run preview

# Option 2: Use a simple HTTP server
npx serve dist

# Option 3: Use Python (if installed)
cd dist
python3 -m http.server 8000
```

---

## Quick Reference Commands

```bash
# Create and switch to new branch
git checkout -b feature/my-feature

# See what branch you're on
git branch

# See what changed
git status
git diff

# Stage and commit
git add .
git commit -m "Your message"

# Push branch
git push -u origin feature/my-feature

# Switch branches
git checkout main
git checkout feature/my-feature

# Update main and merge into your branch
git checkout main
git pull origin main
git checkout feature/my-feature
git merge main

# Test production build
cd movie-draft-app
npm run build
npm run preview
```

---

## Best Practices

1. **Always test locally first** - Don't push broken code
2. **Test the production build** - Dev and production can differ
3. **Commit often** - Small, logical commits are better
4. **Write clear commit messages** - Future you will thank you
5. **Keep main stable** - Only merge tested, working code
6. **Use feature branches** - Never commit directly to main
7. **Pull before pushing** - Stay in sync with remote

---

## Troubleshooting

### "Your branch is ahead of origin/main"

This means you have local commits not pushed yet. Just push:
```bash
git push origin main
```

### "Your branch is behind origin/main"

Someone (or you elsewhere) pushed to main. Pull first:
```bash
git pull origin main
```

### Merge Conflicts

If you get conflicts during merge:
1. Git will mark conflicted files
2. Open them and look for `<<<<<<<` markers
3. Resolve conflicts manually
4. Stage resolved files: `git add .`
5. Complete merge: `git commit`

### "Permission denied" or "Authentication failed"

You need to set up GitHub authentication:
- Use SSH keys, or
- Use GitHub CLI (`gh auth login`), or
- Use a personal access token

---

## Example: Complete Feature Development Cycle

```bash
# 1. Start fresh
cd "/Users/joshuawein/Projects/Movie Draft"
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/commissioner-mode

# 3. Make changes (edit files in your IDE)

# 4. Test locally
cd movie-draft-app
npm run dev
# Test in browser...

# 5. Test production build
npm run build
npm run preview
# Test in browser...

# 6. Commit
git add .
git commit -m "Add Firebase session management"

# 7. Push
git push -u origin feature/commissioner-mode

# 8. (Optional) Create PR on GitHub to test build

# 9. Merge to main (via GitHub or locally)
git checkout main
git merge feature/commissioner-mode
git push origin main

# 10. Clean up
git branch -d feature/commissioner-mode
```

---

## Next Steps

Now you're ready to develop safely! When you start working on Commissioner Mode:

1. Create branch: `git checkout -b feature/commissioner-mode`
2. Make changes
3. Test locally (dev + production build)
4. Commit and push
5. Merge when ready

Happy coding! 🚀

