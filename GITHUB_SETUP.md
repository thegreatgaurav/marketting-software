# How to Push to GitHub

Follow these steps to push your project to GitHub:

## Step 1: Configure Git (First Time Only)

If you haven't configured Git before, set your identity:

```bash
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"
```

Or if you only want to set it for this repository:

```bash
git config user.email "your.email@example.com"
git config user.name "Your Name"
```

## Step 2: Initialize Git Repository

Open your terminal in the project directory and run:

```bash
git init
```

## Step 3: Add All Files

```bash
git add .
```

## Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: Marketing software with Google Sheets, Drive, and VervBridge integration"
```

## Step 5: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Enter repository name (e.g., `marketing-software`)
5. Choose **Private** or **Public** (your preference)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **Create repository**

## Step 6: Add Remote and Push

GitHub will show you commands. Use these (replace `YOUR_USERNAME` and `REPO_NAME`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Alternative: Using SSH

If you prefer SSH (after setting up SSH keys on GitHub):

```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Important Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- **Never commit your service account key file** - Only use the environment variable
- The `.env.example` file is safe to commit (it doesn't contain real credentials)

## Troubleshooting

If you get authentication errors:
- Use a Personal Access Token instead of password
- Or set up SSH keys on GitHub
- Or use GitHub CLI: `gh auth login`

## After Pushing

Your code is now on GitHub and ready to:
- Share with team members
- Deploy to Vercel (connect GitHub repo)
- Track changes and collaborate

