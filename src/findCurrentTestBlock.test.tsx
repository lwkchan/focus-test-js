import { findCurrentTestBlock } from "./findCurrentTestBlock";

describe("findCurrentTestBlock", () => {
  it("should return the correct test block information for various Jest test patterns", () => {
    // Test case 1: Basic test function
    const basicTestText = `describe('My Test Suite', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
  
  it('should validate input', () => {
    expect(false).toBe(false);
  });
});`;

    const basicTestResult = findCurrentTestBlock({
      text: basicTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(basicTestResult).toEqual({
      functionName: "test",
      testName: "should do something",
      line: 1,
      startColumn: 2,
      endColumn: 6,
      isEachCall: false,
    });

    // Test case 2: Test with .only modifier
    const onlyTestText = `describe('My Test Suite', () => {
  test.only('should be focused', () => {
    expect(true).toBe(true);
  });
});`;

    const onlyTestResult = findCurrentTestBlock({
      text: onlyTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(onlyTestResult).toEqual({
      functionName: "test",
      testName: "should be focused",
      line: 1,
      startColumn: 2,
      endColumn: 11, // 2 + 4 + 5 for ".only"
      isEachCall: false,
    });

    // Test case 3: Test with f prefix
    const fTestText = `describe('My Test Suite', () => {
  ftest('should be focused with f', () => {
    expect(true).toBe(true);
  });
});`;

    const fTestResult = findCurrentTestBlock({
      text: fTestText,
      currentLine: 2,
      focusMethod: "f",
    });
    expect(fTestResult).toEqual({
      functionName: "test",
      testName: "should be focused with f",
      line: 1,
      startColumn: 2,
      endColumn: 7, // 2 + 1 + 4 for "f" + "test"
      isEachCall: false,
    });

    // Test case 4: Test.each method call
    const eachTestText = `describe('My Test Suite', () => {
  test.each([1, 2, 3])('should handle %i', (value) => {
    expect(value).toBeDefined();
  });
});`;

    const eachTestResult = findCurrentTestBlock({
      text: eachTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(eachTestResult).toEqual({
      functionName: "test",
      testName: "should handle %i",
      line: 1,
      startColumn: 2,
      endColumn: 6,
      isEachCall: true,
    });

    // Test case 5: Test.only.each method call
    const onlyEachTestText = `describe('My Test Suite', () => {
  test.only.each([1, 2, 3])('should handle %i with focus', (value) => {
    expect(value).toBeDefined();
  });
});`;

    const onlyEachTestResult = findCurrentTestBlock({
      text: onlyEachTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(onlyEachTestResult).toEqual({
      functionName: "test",
      testName: "should handle %i with focus",
      line: 1,
      startColumn: 2,
      endColumn: 11, // 2 + 4 + 5 for ".only"
      isEachCall: true,
    });

    // Test case 6: ftest.each method call
    const fEachTestText = `describe('My Test Suite', () => {
  ftest.each([1, 2, 3])('should handle %i with f prefix', (value) => {
    expect(value).toBeDefined();
  });
});`;

    const fEachTestResult = findCurrentTestBlock({
      text: fEachTestText,
      currentLine: 2,
      focusMethod: "f",
    });
    expect(fEachTestResult).toEqual({
      functionName: "test",
      testName: "should handle %i with f prefix",
      line: 1,
      startColumn: 2,
      endColumn: 7, // 2 + 1 + 4 for "f" + "test"
      isEachCall: true,
    });

    // Test case 7: it function
    const itTestText = `describe('My Test Suite', () => {
  it('should work with it function', () => {
    expect(true).toBe(true);
  });
});`;

    const itTestResult = findCurrentTestBlock({
      text: itTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(itTestResult).toEqual({
      functionName: "it",
      testName: "should work with it function",
      line: 1,
      startColumn: 2,
      endColumn: 4,
      isEachCall: false,
    });

    // Test case 8: describe function
    const describeTestText = `describe('My Test Suite', () => {
  describe('nested describe', () => {
    test('nested test', () => {
      expect(true).toBe(true);
    });
  });
});`;

    const describeTestResult = findCurrentTestBlock({
      text: describeTestText,
      currentLine: 1,
      focusMethod: ".only",
    });
    expect(describeTestResult).toEqual({
      functionName: "describe",
      testName: "nested describe",
      line: 1,
      startColumn: 2,
      endColumn: 10,
      isEachCall: false,
    });

    // Test case 9: No test found
    const noTestText = `const someVariable = 'value';
console.log('Hello world');
// Just some regular code`;

    const noTestResult = findCurrentTestBlock({
      text: noTestText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(noTestResult).toBeNull();

    // Test case 10: Cursor at beginning of file (should find describe block at line 0)
    const beginningResult = findCurrentTestBlock({
      text: basicTestText,
      currentLine: 0,
      focusMethod: ".only",
    });
    expect(beginningResult).toEqual({
      functionName: "describe",
      testName: "My Test Suite",
      line: 0,
      startColumn: 0,
      endColumn: 8,
      isEachCall: false,
    });
  });

  it("should prioritize .each patterns over basic patterns", () => {
    const testText = `describe('Test Suite', () => {
  test('basic test', () => {
    expect(true).toBe(true);
  });
  
  test.each([1, 2])('parameterized test %i', (value) => {
    expect(value).toBeDefined();
  });
});`;

    // When cursor is on line 5 (inside the .each test), it should find the .each pattern
    const result = findCurrentTestBlock({
      text: testText,
      currentLine: 5,
      focusMethod: ".only",
    });
    expect(result).toEqual({
      functionName: "test",
      testName: "parameterized test %i",
      line: 5,
      startColumn: 2,
      endColumn: 6,
      isEachCall: true,
    });
  });

  it("should handle different quote types", () => {
    const singleQuoteText = `test('single quotes', () => {});`;
    const doubleQuoteText = `test("double quotes", () => {});`;
    const backtickText = `test(\`backticks\`, () => {});`;

    const singleResult = findCurrentTestBlock({
      text: singleQuoteText,
      currentLine: 0,
      focusMethod: ".only",
    });
    const doubleResult = findCurrentTestBlock({
      text: doubleQuoteText,
      currentLine: 0,
      focusMethod: ".only",
    });
    const backtickResult = findCurrentTestBlock({
      text: backtickText,
      currentLine: 0,
      focusMethod: ".only",
    });

    expect(singleResult?.testName).toBe("single quotes");
    expect(doubleResult?.testName).toBe("double quotes");
    expect(backtickResult?.testName).toBe("backticks");
  });

  it("should handle indented test functions", () => {
    const indentedText = `describe('Suite', () => {
    test('indented test', () => {
      expect(true).toBe(true);
    });
  });`;

    const result = findCurrentTestBlock({
      text: indentedText,
      currentLine: 2,
      focusMethod: ".only",
    });
    expect(result).toEqual({
      functionName: "test",
      testName: "indented test",
      line: 1,
      startColumn: 4,
      endColumn: 8,
      isEachCall: false,
    });
  });
});
