import * as vscode from 'vscode';
import { DocumentParser } from "../document";


export class JSDocumentParser extends DocumentParser {
    static probe(grammar) {
        return grammar._grammar.name === 'JavaScript (with React support)'
    }

    resolve(fragment, prevFragments){
        const isInString = fragment.hasScope(/^string\.quoted\.(single|double)\.js(\.jsx)?$/);

        if (!isInString)
            return;            

        // backward search for detect quote character(s)
        const startQuoteFragment = [...prevFragments].reverse().find(i => 
            i.isScope(/^punctuation\.definition\.string\.begin\.js(\.jsx)?$/));        
        if (!startQuoteFragment)
            return;
        
        let margin = 0;
        const openQuoteCharacter = startQuoteFragment.text;
        margin = startQuoteFragment.startIndex;        

        return {isInString, openQuoteCharacter, margin};
    }

    edit(editBuilder, originalPosition, newPosition, result) {        
        editBuilder.insert(originalPosition, result.openQuoteCharacter + ' +');
        
        editBuilder.insert(newPosition, ' '.repeat(result.margin));

        editBuilder.insert(newPosition, result.openQuoteCharacter);    
    }
}