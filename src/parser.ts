import { DocumentParser } from './parsers/common';
import { TextEditorEdit } from 'vscode';
import { JSDocumentParser } from './parsers/jsParser';
import { MagicPythonDocumentParser } from './parsers/pythonParser';
import { PhpDocumentParser } from './parsers/phpParser';
import { TextMateRegistry } from './textMate';
import { ISimpleChangeEvent, IParserResult } from './types';
import { reporter } from './extension';


const PARSERS = [MagicPythonDocumentParser, JSDocumentParser, PhpDocumentParser];


export enum ParserState {
    INIT = 'init',
    READY = 'ready',
    ERROR_PARSER_NOT_FOUND = 'parser_not_found',
    ERROR_GRAMMAR_NOT_FOUND = 'grammar_not_found'
}

export class LanguageParser {
    // LanguageParser will be created for each language
    
    static parsers: Map<string, any> = new Map();

    private state: ParserState = ParserState.INIT;
    private registry: TextMateRegistry;
    private parser: DocumentParser | undefined;
    public grammarPromise: Promise<any> = Promise.resolve(true); // For tests purpose;

    constructor(languageId: string, registry?: TextMateRegistry) {
        this.registry = registry || TextMateRegistry.getInstance();

        // Register all parsers
        if (LanguageParser.parsers.size === 0) {
            for (const parser of PARSERS) {
                for (const grammarName of parser.SUPPORTED_GRAMMARS) {
                    LanguageParser.parsers.set(grammarName, parser);
                }
            }
        }

        this.grammarPromise = this.registry.loadGrammar(languageId).then((grammar) => {
            const _grammar:any = (grammar as any)._grammar;
            const grammarName:string = _grammar ? _grammar.name || _grammar.scopeName : null;
            if (!grammarName) {
                this.state = ParserState.ERROR_GRAMMAR_NOT_FOUND;
                return;
            }

            if (!LanguageParser.parsers.has(grammarName)) {
                this.state = ParserState.ERROR_PARSER_NOT_FOUND;
            } else {
                const parser = LanguageParser.parsers.get(grammarName);
                this.parser = new parser(grammar);
                this.state = ParserState.READY;


                // Extension supports this language
                if (reporter) {
                    reporter.sendTelemetryEvent('UsedLanguages', {'languageId': languageId});
                }
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
