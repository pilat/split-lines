import { IGrammar, IToken, StackElement } from 'vscode-textmate';

import { TextDocument, TextDocumentContentChangeEvent, Range, Position, TextEditorEdit } from 'vscode';


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
    readonly NEWLINE_REGEX = /\r\n|\r|\n/;

    constructor(private grammar: IGrammar) { }

    abstract resolve(fragment:LineFragment, prevFragments:LineFragment[]): any;
    abstract edit(editBuilder:TextEditorEdit, originalPosition:Position, newPosition:Position, result: any): void;

    getChanges(doc: TextDocument, contentChange: TextDocumentContentChangeEvent) {
        const insertedText = contentChange.text;
        
        if (insertedText.length < 1) {
            return;
        }

        if (!insertedText.startsWith('\n') && !insertedText.startsWith('\r\n')) {
            return;
        }

        // Restore document content before changes
        let originalPosition:Position = contentChange.range.start;
        let newPosition = doc.positionAt(  doc.offsetAt(originalPosition) + insertedText.length   );
        
        let lText = doc.getText(new Range(new Position(0, 0), originalPosition));
        let rText = doc.getText(new Range(newPosition, new Position(doc.lineCount, 0)));
        let originalText:string = lText + rText;
        
        // Parse fragments until need line
        let resolveResult:any;

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
        
        if (!resolveResult) {
            return;
        }

        let t = this;
        return (editBuilder:TextEditorEdit) => {
            t.edit(editBuilder, originalPosition, newPosition, resolveResult);
        }
    }

    private getFragments(text: string, targetLine: number): LineFragment[] {
        const documentLines:string[] = text.split(this.NEWLINE_REGEX);

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
