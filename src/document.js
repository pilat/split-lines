import * as vscode from 'vscode';
import {ParsedLine} from './line';
import {LineFragment} from './line';


export class DocumentParser {
    grammar = null;

    constructor(grammar) {
        this.grammar = grammar;
    }

    getChanges(doc, contentChange) {
        const insertedText = contentChange.text;
        
        if (!insertedText.startsWith('\n'))
            return;
                
        // Restore document content before changes
        let originalPosition = contentChange.range.start;
        let newPosition = doc.positionAt(  doc.offsetAt(originalPosition) + insertedText.length   );
        
        let lText = doc.getText(new vscode.Range(new vscode.Position(0, 0), originalPosition));
        let rText = doc.getText(new vscode.Range(newPosition, new vscode.Position(doc.lineCount, 0)));
        let originalText = lText + rText;
        
        // Parse fragments until need line
        let resolveResult;

        let i;
        let prevFragments = [];        
        for(let f of this._getFragments(originalText, originalPosition.line)) {
            if(f.lineIndex === originalPosition.line && f.startIndex <= originalPosition.character && 
                originalPosition.character < f.endIndex) {
                resolveResult = this.resolve(f, prevFragments);
                break;
            }            
            prevFragments.push(f);
        }
        
        if (!resolveResult)
            return;

        let t = this;
        return (editBuilder) => 
            t.edit(editBuilder, originalPosition, newPosition, resolveResult);
    }

    resolve(fragment, prevFragments) { }

    edit(editBuilder, originalPosition, newPosition, result) { }

    _getFragments(text, targetLine) {
        const documentLines = text.split('\n');

        let lineIdx;
        let prevState = null;
        let fragments = [];

        // Scan document from start to targetLine
        for(lineIdx = 0; lineIdx < documentLines.length; ++lineIdx) {
            const line = documentLines[lineIdx]; // this.lineAt(lineIdx);
            const tokens = this.grammar.tokenizeLine(line, prevState);

            if (!prevState || prevState.ruleId === 1)
                fragments = [];
            
            for(let t of tokens.tokens) {
                fragments.push(new LineFragment(
                    line.substring(t.startIndex, t.endIndex),
                    lineIdx, t.startIndex, t.endIndex, t.scopes));
            }

            prevState = tokens.ruleStack;

            if (lineIdx === targetLine)
                return fragments;
        }
        return [];
    }
}