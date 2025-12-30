"""
Generate complexity report for Python code using radon
Output: ../docs/server/complexity-report.md
"""

import os
import subprocess
import json
from pathlib import Path


def run_radon_cc(path: str) -> dict:
    """Run radon cyclomatic complexity on given path"""
    try:
        result = subprocess.run(
            ["radon", "cc", path, "-j", "-a"],
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(result.stdout) if result.stdout else {}
    except subprocess.CalledProcessError as e:
        print(f"Error running radon cc: {e}")
        return {}


def run_radon_mi(path: str) -> dict:
    """Run radon maintainability index on given path"""
    try:
        result = subprocess.run(
            ["radon", "mi", path, "-j"], capture_output=True, text=True, check=True
        )
        return json.loads(result.stdout) if result.stdout else {}
    except subprocess.CalledProcessError as e:
        print(f"Error running radon mi: {e}")
        return {}


def get_complexity_rating(complexity: int) -> str:
    """Get rating letter based on McCabe complexity"""
    if complexity <= 5:
        return "A"
    elif complexity <= 10:
        return "B"
    elif complexity <= 20:
        return "C"
    elif complexity <= 30:
        return "D"
    elif complexity <= 40:
        return "E"
    else:
        return "F"


def count_lines(filepath: str) -> int:
    """Count lines in a Python file (excluding blank lines and comments)"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.readlines()]
            # Count non-empty lines that don't start with #
            return len([line for line in lines if line and not line.startswith("#")])
    except Exception as e:
        print(f"Error counting lines in {filepath}: {e}")
        return 0


def main():
    """Generate complexity report"""
    src_path = "src"

    if not os.path.exists(src_path):
        print(f"Error: {src_path} directory not found")
        return 1

    # Get cyclomatic complexity
    cc_data = run_radon_cc(src_path)

    # Get maintainability index
    mi_data = run_radon_mi(src_path)

    # Collect all Python files
    files_data = []

    for filepath, functions in cc_data.items():
        # Skip __pycache__ and venv
        if "__pycache__" in filepath or "venv" in filepath:
            continue

        # Calculate file-level metrics
        total_complexity = 0
        function_count = 0
        max_complexity = 0

        for func in functions:
            if func["type"] in ["function", "method"]:
                complexity = func["complexity"]
                total_complexity += complexity
                function_count += 1
                max_complexity = max(max_complexity, complexity)

        # Get maintainability index
        mi = mi_data.get(filepath, {}).get("mi", 0)
        mi_rating = mi_data.get(filepath, {}).get("rank", "N/A")

        # Count lines
        lines = count_lines(filepath)

        # Average complexity
        avg_complexity = total_complexity / function_count if function_count > 0 else 0

        files_data.append(
            {
                "filepath": filepath,
                "lines": lines,
                "functions": function_count,
                "avg_complexity": avg_complexity,
                "max_complexity": max_complexity,
                "total_complexity": total_complexity,
                "mi": mi,
                "mi_rating": mi_rating,
            }
        )

    # Sort by max complexity descending
    files_data.sort(key=lambda x: x["max_complexity"], reverse=True)

    # Generate report
    report = "# Server Complexity Report (Python)\n\n"
    report += "Generated with [radon](https://radon.readthedocs.io/)\n\n"

    # Table
    report += (
        "| File | Lines | Functions | Avg CC | Max CC | Rating | MI | MI Rating |\n"
    )
    report += (
        "|------|-------|-----------|--------|--------|--------|----|-----------|\n"
    )

    for data in files_data:
        rating = get_complexity_rating(data["max_complexity"])
        report += (
            f"| {data['filepath']} "
            f"| {data['lines']} "
            f"| {data['functions']} "
            f"| {data['avg_complexity']:.1f} "
            f"| {data['max_complexity']} "
            f"| {rating} "
            f"| {data['mi']:.1f} "
            f"| {data['mi_rating']} |\n"
        )

    # Summary
    total_files = len(files_data)
    total_lines = sum(d["lines"] for d in files_data)
    total_functions = sum(d["functions"] for d in files_data)
    avg_complexity = (
        sum(d["avg_complexity"] for d in files_data) / total_files
        if total_files > 0
        else 0
    )
    avg_mi = sum(d["mi"] for d in files_data) / total_files if total_files > 0 else 0

    report += "\n## Summary\n\n"
    report += f"- **Total files**: {total_files}\n"
    report += f"- **Total lines**: {total_lines}\n"
    report += f"- **Total functions**: {total_functions}\n"
    report += f"- **Average complexity**: {avg_complexity:.2f}\n"
    report += f"- **Average maintainability index**: {avg_mi:.2f}\n"

    # Complexity ratings explanation
    report += "\n## Complexity Ratings\n\n"
    report += "**Cyclomatic Complexity (CC):**\n"
    report += "- **A** (1-5): Simple, low risk\n"
    report += "- **B** (6-10): Moderate, low risk\n"
    report += "- **C** (11-20): More complex, moderate risk\n"
    report += "- **D** (21-30): Complex, high risk\n"
    report += "- **E** (31-40): Very complex, very high risk\n"
    report += "- **F** (41+): Extremely complex, maintenance nightmare\n\n"

    report += "**Maintainability Index (MI):**\n"
    report += "- **A** (100-20): Highly maintainable\n"
    report += "- **B** (19-10): Moderately maintainable\n"
    report += "- **C** (9-0): Difficult to maintain\n\n"

    # Files with high complexity
    high_complexity = [d for d in files_data if d["max_complexity"] > 30]
    moderate_complexity = [d for d in files_data if 20 < d["max_complexity"] <= 30]

    report += f"**Files with very high complexity (>30)**: {len(high_complexity)}\n"
    report += f"**Files with high complexity (21-30)**: {len(moderate_complexity)}\n"

    if high_complexity:
        report += "\n### Files needing refactoring (CC > 30):\n"
        for data in high_complexity:
            report += f"- {data['filepath']} (Max CC: {data['max_complexity']})\n"

    # Write report
    output_path = Path("..") / "docs" / "server" / "complexity-report.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"Complexity report generated successfully: {output_path}")
    return 0


if __name__ == "__main__":
    exit(main())
