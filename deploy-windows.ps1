# Deploy TACHI Quest from Windows
# Run this in PowerShell (not WSL)

$token = Read-Host -Prompt "Enter GitHub token (ghp_...)"
$vercelToken = Read-Host -Prompt "Enter Vercel token (vcp_...)"

# Clone fresh
Set-Location $env:TEMP
git clone https://$token@github.com/tachikomared/tachikoma-quest.git tachi-deploy
cd tachi-deploy

# Copy the updated files from WSL
Copy-Item "\\wsl$\Ubuntu\home\tachiboss\tachi\workspace-agents\builder\app\page.tsx" "app\page.tsx" -Force
Copy-Item "\\wsl$\Ubuntu\home\tachiboss\tachi\workspace-agents\builder\app\layout.tsx" "app\layout.tsx" -Force
Copy-Item "\\wsl$\Ubuntu\home\tachiboss\tachi\workspace-agents\builder\app\globals.css" "app\globals.css" -Force
Copy-Item "\\wsl$\Ubuntu\home\tachiboss\tachi\workspace-agents\builder\app\mecha-theme.css" "app\mecha-theme.css" -Force
Copy-Item "\\wsl$\Ubuntu\home\tachiboss\tachi\workspace-agents\builder\app\providers.tsx" "app\providers.tsx" -Force

# Commit and push
git add -A
git commit -m "feat: mecha-crab military UI v2.0"
git push origin master

# Deploy to Vercel
npx vercel@latest --token $vercelToken --prod --yes

Write-Host "Done! Check: https://tachi-quest.vercel.app"
