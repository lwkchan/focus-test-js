// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { findCurrentTestBlock } from "./findCurrentTestBlock";

type FocusMethod = ".only" | "f";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "focus-test-js" is now active!');

  const focusCurrentTest = vscode.commands.registerCommand("focus-test-js.focusCurrentTest", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const text = document.getText();

    // Get user setting for focus method
    const config = vscode.workspace.getConfiguration("focus-test-js");
    const focusMethod = config.get<FocusMethod>("testFocusMethod", ".only");

    // Find the nearest Jest test function before the cursor
    const testFunctionMatch = findCurrentTestBlock(text, position.line, focusMethod);

    if (!testFunctionMatch) {
      vscode.window.showErrorMessage("No Jest test function found before cursor position");
      return;
    }

    const line = document.lineAt(testFunctionMatch.line).text;

    let hasFocus: boolean;
    if (focusMethod === ".only") {
      if (testFunctionMatch.isEachCall) {
        // For .each calls, check for .only before .each
        hasFocus = line.includes(".only") && line.indexOf(".only") < line.indexOf(".each");
      } else {
        hasFocus = line.includes(".only");
      }
    } else {
      // focusMethod === 'f'
      hasFocus = line.includes("f" + testFunctionMatch.functionName);
    }

    // Apply the edit to toggle focus
    const edit = new vscode.WorkspaceEdit();
    const range = new vscode.Range(
      new vscode.Position(testFunctionMatch.line, testFunctionMatch.startColumn),
      new vscode.Position(testFunctionMatch.line, testFunctionMatch.endColumn)
    );

    let newFunctionName: string;
    if (focusMethod === ".only") {
      if (testFunctionMatch.isEachCall) {
        // Handle .each calls
        if (hasFocus) {
          // Remove .only: test.only.each -> test.each
          newFunctionName = testFunctionMatch.functionName;
        } else {
          // Add .only: test.each -> test.only.each
          newFunctionName = testFunctionMatch.functionName + ".only";
        }
      } else {
        // Handle basic calls
        newFunctionName = hasFocus
          ? testFunctionMatch.functionName
          : testFunctionMatch.functionName + ".only";
      }
    } else {
      // focusMethod === 'f'
      newFunctionName = hasFocus
        ? testFunctionMatch.functionName
        : "f" + testFunctionMatch.functionName;
    }

    edit.replace(document.uri, range, newFunctionName);

    vscode.workspace.applyEdit(edit).then(() => {
      const action = hasFocus ? "unfocused" : "focused";
      vscode.window.showInformationMessage(`${action} test: ${testFunctionMatch.testName}`);
    });
  });

  context.subscriptions.push(focusCurrentTest);
}

// This method is called when your extension is deactivated
export function deactivate() {}
