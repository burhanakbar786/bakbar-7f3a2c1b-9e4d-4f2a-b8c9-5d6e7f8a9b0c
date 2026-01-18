# TurboVets Challenge - Quick Start Script
# This script helps verify your environment and set up the project

Write-Host "🚀 TurboVets Challenge - Environment Setup" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Restart your terminal after installation and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Node version (should be 18+)
$versionNumber = $nodeVersion -replace 'v', ''
$majorVersion = [int]($versionNumber.Split('.')[0])
if ($majorVersion -lt 18) {
    Write-Host "⚠ Node.js version should be 18 or higher" -ForegroundColor Yellow
    Write-Host "  Current version: $nodeVersion" -ForegroundColor Yellow
    Write-Host "  Please update Node.js from https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host "`nEnvironment check passed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Seed the database: npm run seed" -ForegroundColor White
Write-Host "3. Start the application: npm run serve:all" -ForegroundColor White
Write-Host "4. Open browser: http://localhost:4200" -ForegroundColor White
Write-Host "`nLogin credentials:" -ForegroundColor Cyan
Write-Host "  Owner: owner@turbovets.com / Password123!" -ForegroundColor White
Write-Host "  Admin: admin@turbovets.com / Password123!" -ForegroundColor White
Write-Host "  Viewer: viewer@turbovets.com / Password123!" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "  README.md - Complete documentation" -ForegroundColor White
Write-Host "  INSTALLATION.md - Detailed setup guide" -ForegroundColor White
Write-Host "  API_TESTING.md - API testing examples" -ForegroundColor White

$response = Read-Host "`nWould you like to install dependencies now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Dependencies installed successfully!" -ForegroundColor Green
        
        $seedResponse = Read-Host "`nWould you like to seed the database? (y/n)"
        if ($seedResponse -eq 'y' -or $seedResponse -eq 'Y') {
            Write-Host "`nSeeding database..." -ForegroundColor Yellow
            npm run seed
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n✓ Database seeded successfully!" -ForegroundColor Green
                Write-Host "`n🎉 Setup complete! Run 'npm run serve:all' to start the application." -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "`nSetup skipped. Run 'npm install' when ready." -ForegroundColor Yellow
}
