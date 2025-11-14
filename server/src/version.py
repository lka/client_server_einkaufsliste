"""Application version information.

This module provides version information for the application.
The version is automatically extracted from git tags during build.
Format: Semantic Versioning (MAJOR.MINOR.PATCH)
"""

import subprocess
from pathlib import Path

# Version from git tags (updated during build)
__version__ = "0.0.6-1-g45a5b18"


def get_version_from_git() -> str:
    """Get version from git tags.

    Returns:
        Version string from git describe, or default version if git is unavailable.

    Note:
        - Uses 'git describe --tags --always' to get version
        - Falls back to __version__ if git is not available
        - Format: v1.2.3 or v1.2.3-5-g1234abc (if commits after tag)
    """
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

    except (
        subprocess.CalledProcessError,
        FileNotFoundError,
        subprocess.TimeoutExpired,
    ):
        # Git not available or no tags found, return default
        return __version__


def get_version() -> str:
    """Get the current application version.

    Returns:
        Version string (semantic versioning format)
    """
    return __version__
