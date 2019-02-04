import { DocumentParser } from './parsers/common';
import { TextDocument, TextDocumentContentChangeEvent, TextEditor } from 'vscode';
import { JSDocumentParser } from './parsers/jsParser';
import { MagicPythonDocumentParser } from './parsers/pythonParser';
import { getTextMateRegistry, grammarCollection, ITextMateRegistry } from './text-mate';


const PARSERS = [MagicPythonDocumentParser, JSDocumentParser];


export enum ParserState {
    INIT = 'init',
    READY = 'ready',
    ERROR_SCOPE_NOT_FOUND = 'scope_not_found',
    ERROR_PARSER_NOT_FOUND = 'parser_not_found',
    ERROR_GRAMMAR_NOT_FOUND = 'grammar_not_found'
}

export class LanguageParser {
    // LanguageParser will be created for each language
    
    static registry: ITextMateRegistry;
    static parsers: Map<string, any> = new Map();

    private state: ParserState = ParserState.INIT;
    private parser: DocumentParser | undefined;

    constructor(languageId: string) {
        // Init registry
        if (!LanguageParser.registry) {
            LanguageParser.registry = getTextMateRegistry();
        }

        // Register all parsers
        if (LanguageParser.parsers.size === 0) {
            for (const parser of PARSERS) {
                for (const grammarName of parser.SUPPORTED_GRAMMARS) {
                    LanguageParser.parsers.set(grammarName, parser);
                }
            }
        }

        const ext = grammarCollection.getByLanguage(languageId);
        if (!ext) {
            this.state = ParserState.ERROR_SCOPE_NOT_FOUND;
            return;
        }

        LanguageParser.registry.loadGrammar(ext.scopeName).then((grammar) => {
            const grammarName:string = (grammar as any)._grammar.name;

            if (!LanguageParser.parsers.has(grammarName)) {
                this.state = ParserState.ERROR_PARSER_NOT_FOUND;
            } else {
                const parser = LanguageParser.parsers.get(grammarName);
                this.parser = new parser(grammar);
                this.state = ParserState.READY;
            }
        }, () => {
            this.state = ParserState.ERROR_GRAMMAR_NOT_FOUND;
        });
    }

    get isReady(): boolean {
        return this.state === ParserState.READY;
    }

    public editDocument(editor: TextEditor, doc: TextDocument,
        contentChange: TextDocumentContentChangeEvent): Thenable<boolean> {
        if (!this.parser) {
            return;
        }

        const callback:any = this.parser.getChanges(doc, contentChange);
        if (!callback) {
            return;
        }

        return editor.edit(editBuilder => {
            callback(editBuilder);
        });
    }
}
