import fetch from "node-fetch";
import * as vscode from "vscode";

/**
 * Iterface that allows us to mock out various user input commands.
 */
export interface UserInput {
  /**
   * Exposes VSCode `showInputBox` function.
   */
  inputBox(label: string, placeholder: string, value?: string): Thenable<string | undefined>
}

/**
 * Implementation of UserInput that uses VSCode's APIs
 */
export class VSCodeInput implements UserInput {

  inputBox(label: string, placeholder: string, value?: string): Thenable<string> {
    return vscode.window.showInputBox({ prompt: label, placeHolder: placeholder, value: value })
  }

}

/**
 * Get the corresponding end of line sequence for the given enum..
 *
 * Is there a built-in way to get this??
 */
function getEOLSequence(eol: vscode.EndOfLine): string {
  switch (eol) {
    case vscode.EndOfLine.LF:
      return "\n"
    case vscode.EndOfLine.CRLF:
      return "\r\n"
  }
}

/**
 * Class that holds all the text editor commands.
 */
export class EditorCommands {

  public static INSERT_LINK = 'esbonio.insert.link'
  public static INSERT_INLINE_LINK = 'esbonio.insert.inlineLink'

  LINK_PATTERN = /\.\.[ ]_\S+:[ ]\S+\n/

  constructor(public userInput: UserInput) { }

  async insertLink(editor: vscode.TextEditor) {
    let link = await this.getLinkInfo(editor)
    if (!link.url || !link.label) {
      return
    }

    let selection = editor.selection
    let eol = getEOLSequence(editor.document.eol)

    let lastLine = editor.document.lineAt(editor.document.lineCount - 1)
    let lineText = editor.document.getText(lastLine.rangeIncludingLineBreak)

    let prefix = ''
    if (lineText.length === 0) {
      let line = editor.document.lineAt(editor.document.lineCount - 2)
      lineText = editor.document.getText(line.rangeIncludingLineBreak)
    } else {
      prefix = eol
    }

    // If the text at the bottom of the page is not a set of links, insert an
    // extra new line to start a separate block.
    if (!this.LINK_PATTERN.test(lineText)) {
      prefix += eol
    }

    let linkRef = `\`${link.label}\`_`
    let linkDef = `${prefix}.. _${link.label}: ${link.url}${eol}`

    await editor.edit(edit => {
      edit.replace(selection, linkRef)
      edit.insert(lastLine.range.end, linkDef)
    })

    // Clear the selection
    let position = editor.selection.end
    editor.selection = new vscode.Selection(position, position)
  }

  /**
 * Insert inline link.
 *
 */
  async insertInlineLink(editor: vscode.TextEditor) {

    let link = await this.getLinkInfo(editor)
    if (!link.url || !link.label) {
      return
    }

    let selection = editor.selection

    let inlineLink = `\`${link.label} <${link.url}>\`_`

    await editor.edit(edit => {
      edit.replace(selection, inlineLink)
    })

    // Clear the selection.
    let position = editor.selection.end
    editor.selection = new vscode.Selection(position, position)
  }

  /**
   * Register all the commands this class provides
   */
  register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(EditorCommands.INSERT_INLINE_LINK, this.insertInlineLink, this))
    context.subscriptions.push(vscode.commands.registerTextEditorCommand(EditorCommands.INSERT_LINK, this.insertLink, this))
  }

  /**
   * Helper function that returns the url to be linked and its label
   */
  private async getLinkInfo(editor: vscode.TextEditor) {
    let label: string;
    let url = await this.userInput.inputBox("Link URL", "https://...")

    const parseTitle = (body) => {
      let match = body.match(/<title>([^<]*)<\/title>/) // regular expression to parse contents of the <title> tag
      if (!match || typeof match[1] !== 'string')
        throw new Error('Unable to parse the title tag')
      return match[1]
    }

    const title = await fetch(url)
    .then(res => res.text()) // parse response's body as text
    .then(body => parseTitle(body))
    .catch(() => null) // extract <title> from body

    let selection = editor.selection
    if (selection.isEmpty) {
      label = await this.userInput.inputBox("Link Text", "Link Text", title)
    } else {
      label = editor.document.getText(selection)
    }

    return { label: label, url: url }
  }
}
