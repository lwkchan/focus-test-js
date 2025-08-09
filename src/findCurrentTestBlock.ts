interface FindCurrentTestBlockParams {
  text: string;
  currentLine: number;
  focusMethod: string;
}

interface JestTestMatch {
  functionName: string;
  testName: string;
  line: number;
  startColumn: number;
  endColumn: number;
  isEachCall: boolean;
}
export function findCurrentTestBlock({
  text,
  currentLine,
  focusMethod,
}: FindCurrentTestBlockParams): JestTestMatch | null {
  const lines = text.split("\n");

  // Look for Jest test patterns (including .each method calls)
  const testPatterns = [
    // .each method calls: (f)?(test|it|describe)(.only)?.each(table)('name', fn)
    /^\s*(f)?(test|it|describe)(\.only)?\.each\s*\([^)]+\)\s*\(\s*['"`]([^'"`]+)['"`]\s*,/,
    // Basic test calls: (f)?(test|it|describe)(.only)?('name', fn)
    /^\s*(f)?(test|it|describe)(\.only)?\s*\(\s*['"`]([^'"`]+)['"`]\s*,/,
  ];

  // First, search for .each patterns (most specific) from current line backwards
  for (let i = currentLine; i >= 0; i--) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const eachMatch = line.match(testPatterns[0]);
    if (eachMatch) {
      return processMatch(eachMatch, line, i, focusMethod, true);
    }
  }

  // If no .each pattern found, search for basic patterns
  for (let i = currentLine; i >= 0; i--) {
    const line = lines[i];
    if (!line) {
      continue;
    }

    const match = line.match(testPatterns[1]);
    if (match) {
      return processMatch(match, line, i, focusMethod, false);
    }
  }

  return null;
}

function processMatch(
  match: RegExpMatchArray,
  line: string,
  lineIndex: number,
  focusMethod: string,
  isEachCall: boolean
): JestTestMatch {
  // New pattern structure: (f)?(test|it|describe)(.only)?('name', fn)
  // match[1] = 'f' or undefined
  // match[2] = 'test', 'it', or 'describe'
  // match[3] = '.only' or undefined
  // match[4] = test name
  const hasF = match[1] === "f";
  const functionName = match[2]; // test, it, or describe
  const hasOnly = match[3] === ".only";
  const testName = match[4]; // the test name from the first string parameter

  // Find the exact position of the function name
  let functionNameIndex = line.indexOf(functionName);
  if (functionNameIndex === -1) {
    throw new Error("Function name not found in line");
  }

  // Adjust for focus modifiers
  if (hasF) {
    // If 'f' is prepended, find the position of 'f' + functionName
    const fFunctionIndex = line.indexOf("f" + functionName);
    if (fFunctionIndex !== -1) {
      functionNameIndex = fFunctionIndex;
    }
  }

  // Check if this function has focus applied
  let hasFocus: boolean;
  if (focusMethod === ".only") {
    hasFocus = hasOnly;
  } else {
    // focusMethod === 'f'
    hasFocus = hasF;
  }

  let endColumn: number;

  if (focusMethod === ".only") {
    if (hasFocus) {
      // Remove .only: test.only -> test or test.only.each -> test.each
      endColumn = functionNameIndex + functionName.length + 5; // +5 for ".only"
    } else {
      // Add .only: test -> test.only or test.each -> test.only.each
      endColumn = functionNameIndex + functionName.length;
    }
  } else {
    // focusMethod === 'f'
    if (hasFocus) {
      // Remove f: ftest -> test
      endColumn = functionNameIndex + 1 + functionName.length; // +1 for "f" + functionName length
    } else {
      // Add f: test -> ftest
      endColumn = functionNameIndex + functionName.length;
    }
  }

  return {
    functionName: functionName,
    testName: testName,
    line: lineIndex,
    startColumn: functionNameIndex,
    endColumn: endColumn,
    isEachCall: isEachCall,
  };
}
