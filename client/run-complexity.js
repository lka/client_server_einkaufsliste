const { readdirSync, statSync, writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

// Recursively find all .ts files in src directory
function findTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Calculate cyclomatic complexity (McCabe complexity)
function calculateCyclomaticComplexity(content) {
  // Cyclomatic complexity = E - N + 2P where:
  // E = number of edges in control flow graph
  // N = number of nodes
  // P = number of connected components (functions)
  //
  // Simplified: count decision points + 1 per function
  // Decision points: if, else if, for, while, case, catch, &&, ||, ?

  const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
  const elseIfStatements = (content.match(/\belse\s+if\s*\(/g) || []).length;
  const loops = (content.match(/\b(for|while|do)\s*\(/g) || []).length;
  const caseStatements = (content.match(/\bcase\s+/g) || []).length;
  const catchBlocks = (content.match(/\bcatch\s*\(/g) || []).length;
  const ternaryOps = (content.match(/\?/g) || []).length;
  const logicalAnd = (content.match(/&&/g) || []).length;
  const logicalOr = (content.match(/\|\|/g) || []).length;

  // Total decision points
  const decisionPoints = ifStatements + elseIfStatements + loops + caseStatements +
                         catchBlocks + ternaryOps + logicalAnd + logicalOr;

  return decisionPoints;
}

// Simple complexity calculation
function calculateComplexity(content) {
  const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
  const functions = (content.match(/function\s+\w+/g) || []).length + (content.match(/=>\s*{/g) || []).length;
  const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
  const loops = (content.match(/\b(for|while)\s*\(/g) || []).length;
  const switches = (content.match(/\bswitch\s*\(/g) || []).length;

  const complexity = ifStatements + loops + switches + functions;

  // Calculate cyclomatic complexity
  const cyclomaticComplexity = calculateCyclomaticComplexity(content);

  // McCabe complexity is essentially the same as cyclomatic complexity
  // but we add 1 for each function as a connected component
  const mccabeComplexity = cyclomaticComplexity + functions;

  return {
    lines,
    functions,
    complexity,
    cyclomaticComplexity,
    mccabeComplexity
  };
}

try {
  const tsFiles = findTsFiles('src');

  if (tsFiles.length === 0) {
    console.error('No TypeScript files found');
    process.exit(1);
  }

  console.log(`Found ${tsFiles.length} TypeScript files`);

  let report = '# Complexity Report\n\n';
  report += '| File | Lines | Functions | Complexity | Cyclomatic | McCabe |\n';
  report += '|------|-------|-----------|------------|------------|--------|\n';

  const results = [];

  tsFiles.forEach(file => {
    try {
      const content = readFileSync(file, 'utf8');
      const stats = calculateComplexity(content);
      results.push({ file, ...stats });
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  });

  // Sort by McCabe complexity descending (most comprehensive metric)
  results.sort((a, b) => b.mccabeComplexity - a.mccabeComplexity);

  results.forEach(({ file, lines, functions, complexity, cyclomaticComplexity, mccabeComplexity }) => {
    report += `| ${file} | ${lines} | ${functions} | ${complexity} | ${cyclomaticComplexity} | ${mccabeComplexity} |\n`;
  });

  report += `\n## Summary\n\n`;
  report += `- Total files: ${results.length}\n`;
  report += `- Total lines: ${results.reduce((sum, r) => sum + r.lines, 0)}\n`;
  report += `- Total functions: ${results.reduce((sum, r) => sum + r.functions, 0)}\n`;
  report += `- Average complexity: ${(results.reduce((sum, r) => sum + r.complexity, 0) / results.length).toFixed(2)}\n`;
  report += `- Average cyclomatic complexity: ${(results.reduce((sum, r) => sum + r.cyclomaticComplexity, 0) / results.length).toFixed(2)}\n`;
  report += `- Average McCabe complexity: ${(results.reduce((sum, r) => sum + r.mccabeComplexity, 0) / results.length).toFixed(2)}\n`;

  report += `\n## Complexity Ratings\n\n`;
  report += `McCabe Complexity Thresholds:\n`;
  report += `- 1-10: Simple, low risk\n`;
  report += `- 11-20: More complex, moderate risk\n`;
  report += `- 21-50: Complex, high risk\n`;
  report += `- 51+: Very complex, very high risk\n\n`;

  const highComplexity = results.filter(r => r.mccabeComplexity > 50);
  const moderateComplexity = results.filter(r => r.mccabeComplexity > 20 && r.mccabeComplexity <= 50);

  report += `Files with very high complexity (>50): ${highComplexity.length}\n`;
  report += `Files with high complexity (21-50): ${moderateComplexity.length}\n`;

  const outputPath = join('..', 'docs', 'client', 'complexity-report.md');
  writeFileSync(outputPath, report);
  console.log(`Complexity report generated successfully: ${outputPath}`);
} catch (error) {
  console.error('Error generating complexity report:', error.message);
  const outputPath = join('..', 'docs', 'client', 'complexity-report.md');
  writeFileSync(outputPath, `Error: ${error.message}`);
  process.exit(1);
}
