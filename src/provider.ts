import { LanguageParser } from './parser';
import { TextDocument, window, TextDocumentChangeEvent } from "vscode";


export class SplitLinesProvider {
    private parsers:Map<string, LanguageParser> = new Map();
    public editPromises:any = null;  // null - disabled, array - activated for tests

    public openDocument(doc: TextDocument) {
        if (!this.parsers.has(doc.languageId)){
            this.parsers.set(doc.languageId, new LanguageParser(doc.languageId));
        }
    }

    public changeDocument(event:TextDocumentChangeEvent) {
        const doc: TextDocument = event.document;
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const parser:LanguageParser | undefined = this.parsers.get(doc.languageId);
        if (!parser || !parser.isReady) {
            return;
        }

        try {
            for (let contentChange of event.contentChanges) {
                const prom1 = parser.editDocument(editor, doc, contentChange);
                if (this.editPromises != null) {
                    this.editPromises.push(prom1);
                }
                // if (SplitLinesProvider.debugTrace) {
                //     SplitLinesProvider.debugPromises.push(prom1)
                // }
            }
        }catch(e) {
            // noop
        }
    }
}
