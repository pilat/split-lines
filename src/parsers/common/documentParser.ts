import { ISimpleChangeEvent, NEWLINE_REGEX, IParserResult } from './../../types';
import { IGrammar, IToken, StackElement } from 'vscode-textmate';

import { TextEditorEdit } from 'vscode';
import { LineFragment } from './lineFragment';


export abstract class DocumentParser {
    constructor(private grammar: IGrammar) { }

    public abstract resolve(fragment: LineFragment, prevFragments: LineFragment[]): any;
    // abstract edit(editBuilder:TextEditorEdit, originalPosition:Position, newPosition:Position, result: any): void;
    public abstract edit(editBuilder: TextEditorEdit, item: IParserResult): number;

    // getChanges(doc: TextDocument, contentChange: TextDocumentContentChangeEvent) {
    public getChange(originalText: string, event: ISimpleChangeEvent) {
        // Parse fragments until need line
        const originalPosition = event.originalPosition;
        // const newPosition = event.newPosition;
        let resolveResult: any = null;

        let f: LineFragment;
        const prevFragments: LineFragment[] = [];
        for (f of this.getFragments(originalText, originalPosition.line)) {
            if (f.lineIndex === originalPosition.line && f.startIndex <= originalPosition.character &&
                originalPosition.character < f.endIndex) {
                resolveResult = this.resolve(f, prevFragments);
                break;
            }
            prevFragments.push(f);
        }

        return resolveResult;
    }

    private getFragments(text: string, targetLine: number): LineFragment[] {
        const documentLines: string[] = text.split(NEWLINE_REGEX);

        let t: IToken;
        let lineIdx: number;
        let prevState: StackElement | null = null;
        let fragments: LineFragment[] = [];

        // Scan document from start to targetLine
        for (lineIdx = 0; lineIdx < documentLines.length; ++lineIdx) {
            const line = documentLines[lineIdx]; // this.lineAt(lineIdx);
            const tokens = this.grammar.tokenizeLine(line, prevState);

            if (!prevState || (prevState as any).ruleId === 1) {
                fragments = [];
            }

            for (t of tokens.tokens) {
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
