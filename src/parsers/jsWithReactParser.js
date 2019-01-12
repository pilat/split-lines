import * as vscode from 'vscode';
import { DocumentParser } from "../document";


export class JSDocumentParser extends DocumentParser {
    static probe(grammar) {
        const suitable = ['JavaScript (with React support)', 'TypeScript', 'TypeScriptReact']

        return suitable.indexOf(grammar._grammar.name) !== -1
    }

    resolve(fragment, prevFragments){
        const isInString = fragment.hasScope(/^string\.quoted\.(single|double)(\.js(\.jsx)?|\.tsx?)$/);
        
        if (!isInString)
            return;
        
        if (fragment.isScope(/^punctuation\.definition\.string\.begin(\.js(\.jsx)?|\.tsx?)$/))
            return;

        // backward search for detect quote character(s)
        const startQuoteFragment = [...prevFragments].reverse().find(i => 
            i.isScope(/^punctuation\.definition\.string\.begin(\.js(\.jsx)?|\.tsx?)$/));
        if (!startQuoteFragment)
            return;
        
        let margin = 0;
        const openQuoteCharacter = startQuoteFragment.text;
        margin = startQuoteFragment.startIndex;

        return {isInString, openQuoteCharacter, margin};
    }

    edit(editBuilder, originalPosition, newPosition, result) {
        editBuilder.insert(originalPosition, result.openQuoteCharacter + ' +');
        
        // Consider VS Code made margin
        let realMargin = result.margin - newPosition.character;
        if (realMargin > 0)
            editBuilder.insert(newPosition, ' '.repeat(realMargin));

        editBuilder.insert(newPosition, result.openQuoteCharacter);
    }
}