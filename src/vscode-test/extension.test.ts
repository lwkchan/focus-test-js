// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import assert from "assert";
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("should be able to focus current test", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      assert.fail("No active editor found");
    }

    const document = editor.document;
    const position = editor.selection.active;
    const text = document.getText();

    console.log(text);
    console.log(position);
  });
});
