import * as vscode from 'vscode';
import { DocumentParser } from "../document";


export class MagicPythonDocumentParser extends DocumentParser {
    static probe(grammar) {
        return grammar._grammar.name === 'MagicPython'
    }

    resolve(fragment, prevFragments){
        const isInString = fragment.hasScope('string.quoted.single.python') && 
            fragment.scopes[fragment.scopes.length-1] !== 'punctuation.definition.string.begin.python';

        if (!isInString)
            return;
        
        const isInList = !!prevFragments.find(i => 
            i.hasScope('punctuation.parenthesis.begin.python') || 
            i.hasScope('punctuation.definition.list.begin.python') || 
            i.hasScope('punctuation.definition.arguments.begin.python'));

        // backward search for detect quote character(s)
        let openQuoteCharacter = null;
        let margin = 0;
        let marginCorrection = 0;
        const startQuoteFragment = [...prevFragments].reverse().find(i => 
            i.isScope('punctuation.definition.string.begin.python'));
        
        if (startQuoteFragment) {
            openQuoteCharacter = startQuoteFragment.text;
            margin = startQuoteFragment.startIndex;   // - line start char (for Python)

            // Detect start offset to correct margin (e.g. vscode made margin)
            let firstFragmentOnLine = prevFragments.filter(i => i.lineIndex === fragment.lineIndex)[0];
            if (firstFragmentOnLine && firstFragmentOnLine.text.match(/^\s+$/))
                marginCorrection = firstFragmentOnLine.text.length;
        }                        
        
        if (!openQuoteCharacter)
            return;
        
        return {isInString, isInList, openQuoteCharacter, margin, marginCorrection};
    }

    edit(editBuilder, originalPosition, newPosition, result) {
        if (!result.isInList) {
            editBuilder.insert(originalPosition, result.openQuoteCharacter + ' \\');            
        } else {
            editBuilder.insert(originalPosition, result.openQuoteCharacter);
        }
        
        // When VS Code make self ident we're use marginCorrection. 
        editBuilder.insert(newPosition, ' '.repeat(result.margin + 
            (newPosition.character != 0 ? result.marginCorrection : 0)));
        editBuilder.insert(newPosition, result.openQuoteCharacter);    
    }
}