# Deploy kaalkine portfolio to GitHub Pages (kaalkine/kaalkine.github.io)
# Prerequisites: gh auth login (as kaalkine account)
param(
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Require-Gh {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is required. Install: winget install GitHub.cli"
  }
  gh auth status 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to GitHub. Run: gh auth login -h github.com -p https -w -s repo,workflow"
    throw "gh auth required"
  }
}

Write-Host "==> Verifying gh auth..."
Require-Gh

if (-not $SkipTests) {
  Write-Host "==> Running tests..."
  npm test
}

$owner = "kaalkine"
$repo = "kaalkine.github.io"

Write-Host "==> Ensuring repository $owner/$repo exists..."
$exists = gh repo view "$owner/$repo" --json name -q .name 2>$null
if (-not $exists) {
  gh repo create "$owner/$repo" --public --description "Kaalkine thumbnail portfolio site"
  if ($LASTEXITCODE -ne 0) { throw "Failed to create repository" }
  Write-Host "Created $owner/$repo"
} else {
  Write-Host "Repository already exists"
}

Write-Host "==> Configuring git remote..."
$remoteUrl = "https://github.com/$owner/$repo.git"
if (git remote get-url origin 2>$null) {
  git remote set-url origin $remoteUrl
} else {
  git remote add origin $remoteUrl
}

Write-Host "==> Pushing main branch..."
git branch -M main
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "git push failed" }

Write-Host "==> Enabling GitHub Pages (main / root)..."
gh api "repos/$owner/$repo/pages" -X POST -f "source[branch]=main" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh api "repos/$owner/$repo/pages" -X PUT -f "source[branch]=main" -f "source[path]=/" 2>$null
}

Write-Host ""
Write-Host "Deploy complete!"
Write-Host "  Site:  https://kaalkine.github.io"
Write-Host "  Admin: https://kaalkine.github.io/krishnanandg/"
Write-Host ""
Write-Host "Next steps (one-time):"
Write-Host "  1. Create a fine-grained PAT on kaalkine with Contents read/write on this repo"
Write-Host "  2. Unlock admin at /krishnanandg/ with that token"
Write-Host "  3. Add https://kaalkine.github.io as allowed domain in Formspree"
