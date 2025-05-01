# Setting Up V0 Projects from Vercel

This guide addresses common dependency and Node.js version issues when working with v0.dev projects.

## Quick Solution for Current Project

1. Run the following commands in your project directory:

```powershell
# Create .npmrc file to fix dependency issues
echo legacy-peer-deps=true > .npmrc

# Install dependencies
npm install
```

## Node.js Version Requirements

Next.js requires Node.js "^18.18.0 || ^19.8.0 || >= 20.0.0", but you're currently using Node.js 18.15.0.

### Option 1: Install Node.js 20 (Recommended)

1. Download and install Node.js 20 LTS from: https://nodejs.org/

2. After installation, restart any open terminal windows.

3. Verify your Node.js version:
   ```
   node -v
   ```

### Option 2: Use a Node Version Manager

If you frequently work with different Node.js versions, consider installing a version manager:

- For Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)
- For macOS/Linux: [nvm](https://github.com/nvm-sh/nvm)

After installing nvm-windows, you can:
```
nvm install 20.10.0
nvm use 20.10.0
```

## Solving Dependency Issues

For any v0 project, create a `.npmrc` file with the following content:

```
legacy-peer-deps=true
```

This tells npm to use the legacy peer dependency resolution algorithm, which is more forgiving with dependency conflicts.

### Common Issues Fixed

1. **date-fns and react-day-picker conflict**: This is fixed by:
   - Using `legacy-peer-deps=true`
   - Updating date-fns to version 3.0.0 (compatible with react-day-picker)

2. **Node.js version requirements**: Next.js requires Node.js ≥ 18.18.0

## Creating a Central Setup Script

For a more permanent solution, you can create a setup script in your user directory to copy to any v0 project:

1. Save this as `setup-v0.ps1` in your Documents folder
2. Copy this file to any new v0 project you download
3. Run it with PowerShell to automatically fix common issues 