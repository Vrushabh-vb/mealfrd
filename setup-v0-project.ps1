# V0 Project Setup Script

function Update-PackageJson {
    param (
        [string]$filePath = "package.json"
    )

    if (Test-Path $filePath) {
        $packageJson = Get-Content $filePath -Raw | ConvertFrom-Json
        
        # Check if date-fns exists and is incompatible with react-day-picker
        if ($packageJson.dependencies.'date-fns' -and $packageJson.dependencies.'react-day-picker') {
            $dateFnsVersion = $packageJson.dependencies.'date-fns'
            $reactDayPickerVersion = $packageJson.dependencies.'react-day-picker'
            
            # If date-fns is version 4.x.x, update it to 3.0.0
            if ($dateFnsVersion -match '^[4-9]') {
                Write-Host "Updating date-fns from $dateFnsVersion to ^3.0.0 to be compatible with react-day-picker..."
                $packageJson.dependencies.'date-fns' = "^3.0.0"
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content $filePath
            }
        }
    } else {
        Write-Host "package.json not found in current directory."
    }
}

function Setup-V0Project {
    # Create .npmrc with legacy-peer-deps=true
    Write-Host "Creating .npmrc with legacy-peer-deps=true..."
    "legacy-peer-deps=true" | Out-File -FilePath ".npmrc" -Encoding ascii

    # Check if NVM is installed and use Node 20
    if (Get-Command "nvm" -ErrorAction SilentlyContinue) {
        Write-Host "Using Node.js 20 via NVM..."
        nvm use 20
    } else {
        Write-Host "NVM not found. Please manually ensure you're using Node.js 20+."
    }

    # Update package.json if needed
    Update-PackageJson

    # Install dependencies
    Write-Host "Installing dependencies..."
    npm install

    Write-Host "`nV0 project setup complete! You can now run:" -ForegroundColor Green
    Write-Host "npm run dev" -ForegroundColor Cyan
}

# Run the setup
Setup-V0Project

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 