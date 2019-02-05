import { DocumentParser } from './parsers/common';
import { TextEditorEdit } from 'vscode';
import { JSDocumentParser } from './parsers/jsParser';
import { MagicPythonDocumentParser } from './parsers/pythonParser';
import { PhpDocumentParser } from './parsers/phpParser';
import { getTextMateRegistry, grammarCollection, ITextMateRegistry } from './text-mate';
import { ISimpleChangeEvent, IParserResult } from './types';


const PARSERS = [MagicPythonDocumentParser, JSDocumentParser, PhpDocumentParser];


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
            const grammarName:string = (grammar as any)._grammar.name || (grammar as any)._grammar.scopeName;
            if (!grammarName) {
                this.state = ParserState.ERROR_GRAMMAR_NOT_FOUND;
            }

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

    public getChange(text:string, event: ISimpleChangeEvent): IParserResult {
        return {
            event: event,
            result: this.parser.getChange(text, event)
        }
    }

    public applyChange(editBuilder:TextEditorEdit, item:IParserResult): number {
        return this.parser.edit(editBuilder, item);
    }

}
