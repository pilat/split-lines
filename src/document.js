import * as vscode from 'vscode';
import {ParsedLine} from './line';
import {LineFragment} from './line';


export class DocumentParser {
    grammar = null;
    lines = null;

    constructor(grammar) {
        console.log('Document constructor');        
        this.grammar = grammar;
    }

    async onChange(event) {
        if (!event.contentChanges[0])
            return;
    
        let contentChange = event.contentChanges[0],
            doc = event.document;
        
        const insertedText = contentChange.text;
        
        if (!insertedText.startsWith('\n'))
            return;

                
        // Restore document content before changes
        let originalPosition = contentChange.range.start;
        let newPosition = doc.positionAt(  doc.offsetAt(originalPosition) + insertedText.length   );
        
        let lText = doc.getText(new vscode.Range(new vscode.Position(0, 0), originalPosition));
        let rText = doc.getText(new vscode.Range(newPosition, new vscode.Position(doc.lineCount, 0)));
        let originalText = lText + rText;
        
        // Load lines (restored document):
        this.lines = originalText.split('\n');

        // Parse lines
        let resolveResult = this._resolve(originalPosition);
        if (!resolveResult)
            return;

        const editor = vscode.window.activeTextEditor;
        editor.edit((editBuilder) => {
            this.edit(editBuilder, originalPosition, newPosition, resolveResult);
        }).then(() => {
            // pass
        });
    }

    _resolve(position) {
        const lineIdx = position.line;
        console.time('Parse');
        const fragments = this._getFragments(lineIdx);
        console.timeEnd('Parse');

        let i;
        let checkedFragments = [];        
        for(let f of fragments) {
            if(f.lineIndex === lineIdx && f.startIndex <= position.character && position.character < f.endIndex) {
                let result = this.resolve(f, checkedFragments);
                console.log(JSON.stringify(result));
                return result;
            }
            
            checkedFragments.push(f);
        }
    }

    resolve(fragment, prevFragments){
        console.warn('Not implement');
    }

    edit(editBuilder, originalPosition, newPosition, result) {
        console.warn('Not implement');
    }

    _getFragments(targetLine) {
        let lineIdx;
        let prevState = null;
        let fragments = [];

        // Scan document from start to targetLine
        for(lineIdx = 0; lineIdx < this.lines.length; ++lineIdx) {
            const line = this.lines[lineIdx]; // this.lineAt(lineIdx);
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
    }
}