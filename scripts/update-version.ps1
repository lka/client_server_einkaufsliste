# Update version information from git tags
# This script extracts the version from git tags and updates version files

Write-Host "Updating version information from git tags..." -ForegroundColor Cyan

# Get version from git
try {
    $gitVersion = git describe --tags --always --dirty 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "No git tags found. Using default version 0.1.0" -ForegroundColor Yellow
        $version = "0.1.0"
    } else {
        # Remove 'v' prefix if present
        $version = $gitVersion -replace '^v', ''
        Write-Host "Found git version: $version" -ForegroundColor Green
    }
} catch {
    Write-Host "Git not available. Using default version 0.1.0" -ForegroundColor Yellow
    $version = "0.1.0"
}

# Update server version.py
$serverVersionFile = "server\src\version.py"
$serverVersionContent = @"
"""Application version information.

This module provides version information for the application.
The version is automatically extracted from git tags during build.
Format: Semantic Versioning (MAJOR.MINOR.PATCH)
"""

import subprocess
from pathlib import Path

# Version from git tags (updated during build)
__version__ = "$version"


def get_version_from_git() -> str:
    `"`"`"Get version from git tags.

    Returns:
        Version string from git describe, or default version if git is unavailable.

    Note:
        - Uses 'git describe --tags --always' to get version
        - Falls back to __version__ if git is not available
        - Format: v1.2.3 or v1.2.3-5-g1234abc (if commits after tag)
    `"`"`"
    try:
        # Get the git repository root
        repo_root = Path(__file__).parent.parent.parent

        # Run git describe to get version from tags
        result = subprocess.run(
            ["git", "describe", "--tags", "--always", "--dirty"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=True,
            timeout=5,
        )

        version = result.stdout.strip()

        # Remove 'v' prefix if present
        if version.startswith("v"):
            version = version[1:]

        return version

    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        # Git not available or no tags found, return default
        return __version__


def get_version() -> str:
    `"`"`"Get the current application version.

    Returns:
        Version string (semantic versioning format)
    `"`"`"
    return __version__
"@

Write-Host "Updating $serverVersionFile..." -ForegroundColor Cyan
Set-Content -Path $serverVersionFile -Value $serverVersionContent -Encoding UTF8
Write-Host "Server version updated to: $version" -ForegroundColor Green

# Update client version.json
$clientVersionFile = "client\src\version.json"
$clientVersionContent = @"
{
  "version": "$version",
  "buildDate": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
}
"@

Write-Host "Updating $clientVersionFile..." -ForegroundColor Cyan
Set-Content -Path $clientVersionFile -Value $clientVersionContent -Encoding UTF8
Write-Host "Client version updated to: $version" -ForegroundColor Green

Write-Host "`nVersion update complete!" -ForegroundColor Green
Write-Host "Current version: $version" -ForegroundColor Cyan
