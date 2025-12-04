# PowerShell deployment script for Vercel

Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy to Vercel with production flag
# Environment variables should be set in Vercel Dashboard:
# - REACT_APP_API_URL
# - REACT_APP_SOCKET_URL
vercel --prod

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Check Vercel Dashboard for your deployment URL" -ForegroundColor Yellow
