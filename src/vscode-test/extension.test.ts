import assert from "assert";
import * as vscode from "vscode";

const getActiveEditor = async () => {
  let activeEditor = vscode.window.activeTextEditor;
  let attempts = 0;
  while (!activeEditor && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    activeEditor = vscode.window.activeTextEditor;
    attempts++;
  }

  if (!activeEditor) {
    assert.fail("No active editor found after waiting");
  }

  return activeEditor;
};

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("should focus current test", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: `describe('My Test Suite', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
  
  it('should validate input', () => {
    expect(false).toBe(false);
  });
});`,
      language: "typescript",
    });

    await vscode.window.showTextDocument(doc);

    const activeEditor = await getActiveEditor();

    // move cursor to first test
    activeEditor.selection = new vscode.Selection(2, 0, 2, 0);

    // trigger the extension
    await vscode.commands.executeCommand("focus-test-js.focusCurrentTest");

    assert.strictEqual(
      activeEditor.document.getText().includes(
        `describe('My Test Suite', () => {
  test.only('should do something', () => {
    expect(true).toBe(true);
  });
  
  it('should validate input', () => {
    expect(false).toBe(false);
  });
});`
      ),
      true,
      "Document should contain the expected test content with .only modifier"
    );
  });
  test("should focus on nested test.each block", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: `describe("system", () => {
  test.each([
    [1, 1, 2],
    [1, 2, 3],
    [2, 1, 3],
  ])(".add(%i, %i)", (a, b, expected) => {
    test(\`returns $\{expected}\`, () => {
      expect(a + b).toBe(expected);
    });
  });
});
`,
      language: "typescript",
    });

    await vscode.window.showTextDocument(doc);

    const activeEditor = await getActiveEditor();

    activeEditor.selection = new vscode.Selection(5, 0, 5, 0);

    await vscode.commands.executeCommand("focus-test-js.focusCurrentTest");

    assert.strictEqual(
      activeEditor.document.getText().includes(
        `describe("system", () => {
  test.only.each([
    [1, 1, 2],
    [1, 2, 3],
    [2, 1, 3],
  ])(".add(%i, %i)", (a, b, expected) => {
    test(\`returns $\{expected}\`, () => {
      expect(a + b).toBe(expected);
    });
  });
});
`
      ),
      true,
      "Document should contain the expected test content with .only modifier"
    );
  });
});
