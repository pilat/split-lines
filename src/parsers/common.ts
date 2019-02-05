import { ISimpleChangeEvent, NEWLINE_REGEX, IParserResult } from './../types';
import { IGrammar, IToken, StackElement } from 'vscode-textmate';

import { TextEditorEdit } from 'vscode';


export class LineFragment {
    constructor(public text:string,
        public lineIndex:number,
        public startIndex:number,
        public endIndex:number,
        public scopes:string[]) { }

    hasScope(value: RegExp | string): boolean {
        if (value instanceof RegExp) {
            for(let i=0; i<this.scopes.length; ++i){
                if (this.scopes[i].match(value)) {
                    return true;
                }
            }
            return false;
        } else {
            return this.scopes.indexOf(value) !== -1;
        }
    }

    isScope(value: RegExp | string): boolean {
        if (value instanceof RegExp) {
            return !!this.scopes[this.scopes.length-1].match(value);
        } else {
            return this.scopes[this.scopes.length-1] === value;
        }
    }
}

export abstract class DocumentParser {
    constructor(private grammar: IGrammar) { }

    abstract resolve(fragment:LineFragment, prevFragments:LineFragment[]): any;
    // abstract edit(editBuilder:TextEditorEdit, originalPosition:Position, newPosition:Position, result: any): void;
    abstract edit(editBuilder:TextEditorEdit, item:IParserResult): number;

    // getChanges(doc: TextDocument, contentChange: TextDocumentContentChangeEvent) {
    getChange(originalText:string, event: ISimpleChangeEvent) {
        // Parse fragments until need line
        const originalPosition = event.originalPosition;
        // const newPosition = event.newPosition;
        let resolveResult:any = null;

        let f:LineFragment;
        let prevFragments:LineFragment[] = [];
        for(f of this.getFragments(originalText, originalPosition.line)) {
            if(f.lineIndex === originalPosition.line && f.startIndex <= originalPosition.character && 
                originalPosition.character < f.endIndex) {
                resolveResult = this.resolve(f, prevFragments);
                break;
            }            
            prevFragments.push(f);
        }

        return resolveResult;
    }

    private getFragments(text: string, targetLine: number): LineFragment[] {
        const documentLines:string[] = text.split(NEWLINE_REGEX);

        let t:IToken;
        let lineIdx:number;
        let prevState:StackElement | null = null;
        let fragments:LineFragment[] = [];

        // Scan document from start to targetLine
        for(lineIdx = 0; lineIdx < documentLines.length; ++lineIdx) {
            const line = documentLines[lineIdx]; // this.lineAt(lineIdx);
            const tokens = this.grammar.tokenizeLine(line, prevState);

            if (!prevState || (prevState as any).ruleId === 1) {
                fragments = [];
            }
            
            for(t of tokens.tokens) {
                fragments.push(new LineFragment(
                    line.substring(t.startIndex, t.endIndex),
                    lineIdx, t.startIndex, t.endIndex, t.scopes));
            }

            prevState = tokens.ruleStack;

            if (lineIdx === targetLine) {
                return fragments;
            }
        }
        return [];
    }
}
