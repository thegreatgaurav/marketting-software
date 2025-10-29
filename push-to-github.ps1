# PowerShell script to push to GitHub
# Make sure you've created the repository on GitHub first!

Write-Host "=== GitHub Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Git not initialized. Initializing..." -ForegroundColor Yellow
    git init
}

# Check current branch
$branch = git branch --show-current
if (-not $branch) {
    $branch = "main"
    git branch -M main
}

Write-Host "Current branch: $branch" -ForegroundColor Green
Write-Host ""

# Check if remote exists
$remoteUrl = git remote get-url origin 2>$null

if ($remoteUrl) {
    Write-Host "Remote 'origin' already exists: $remoteUrl" -ForegroundColor Yellow
    $response = Read-Host "Do you want to use this remote? (y/n)"
    if ($response -ne "y") {
        git remote remove origin
        $remoteUrl = $null
    }
}

if (-not $remoteUrl) {
    Write-Host ""
    Write-Host "Please provide your GitHub repository URL:" -ForegroundColor Cyan
    Write-Host "Format: https://github.com/thegreatgaurav/REPO_NAME.git" -ForegroundColor Gray
    Write-Host "Or: git@github.com:thegreatgaurav/REPO_NAME.git (for SSH)" -ForegroundColor Gray
    Write-Host ""
    $repoUrl = Read-Host "Enter repository URL"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "Remote added successfully!" -ForegroundColor Green
    } else {
        Write-Host "No URL provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan

# Push to GitHub
git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository URL: $remoteUrl" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Push failed. Common issues:" -ForegroundColor Red
    Write-Host "  1. Repository doesn't exist on GitHub yet" -ForegroundColor Yellow
    Write-Host "  2. Authentication required (use Personal Access Token)" -ForegroundColor Yellow
    Write-Host "  3. SSH keys not set up (if using SSH URL)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create the repository:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "  2. Repository name: marketing-software (or your choice)" -ForegroundColor White
    Write-Host "  3. Choose Public or Private" -ForegroundColor White
    Write-Host "  4. DO NOT initialize with README" -ForegroundColor White
    Write-Host "  5. Click 'Create repository'" -ForegroundColor White
    Write-Host "  6. Run this script again" -ForegroundColor White
}

