import { DocumentParser, LineFragment } from './common';
import { Position, TextEditorEdit } from 'vscode';


interface IPythonResolveResult {
    isInString: boolean;
    isInList: boolean;
    openQuoteCharacter: string;
    margin: number;
}


export class MagicPythonDocumentParser extends DocumentParser {
    public static SUPPORTED_GRAMMARS = ['MagicPython'];

    public resolve(fragment:LineFragment, prevFragments:LineFragment[]): IPythonResolveResult | undefined {
        const isInString = (fragment.hasScope('string.quoted.single.python') ||
            fragment.hasScope('string.quoted.docstring.single.python')) && 
            fragment.scopes[fragment.scopes.length-1] !== 'punctuation.definition.string.begin.python';

        if (!isInString) {
            return;
        }
        
        let isInList = false;
        // Scan backward. When we found opened fragment, then we're in list 
        // but when we detected closed, then skip additional checking):
        for(let i=prevFragments.length-1;i>=0;i--) {
            const frag = prevFragments[i];
            if (frag.hasScope('punctuation.parenthesis.begin.python') || 
                frag.hasScope('punctuation.definition.list.begin.python') || 
                frag.hasScope('punctuation.definition.arguments.begin.python')) {
                isInList = true;
                break;
            } else if (frag.hasScope('punctuation.parenthesis.end.python') || 
                frag.hasScope('punctuation.definition.list.end.python') || 
                frag.hasScope('punctuation.definition.arguments.end.python')) {
                    break;
                }
        }

        // backward search adn detect quote character(s)
        let openQuoteCharacter = null;
        let margin = 0;
        const startQuoteFragment = [...prevFragments].reverse().find(i => 
            i.isScope('punctuation.definition.string.begin.python'));
        
        if (startQuoteFragment) {
            openQuoteCharacter = startQuoteFragment.text;
            margin = startQuoteFragment.startIndex;   // - line start char (for Python)

            // Detect start offset to correct margin (e.g. vscode made margin)
            // let firstFragmentOnLine = prevFragments.filter(i => i.lineIndex === fragment.lineIndex)[0];
        }
        
        if (!openQuoteCharacter) {
            return;
        }
        
        return {isInString, isInList, openQuoteCharacter, margin};
    }

    public edit(editBuilder:TextEditorEdit, originalPosition:Position, newPosition:Position, result:IPythonResolveResult): void {
        if (!result.isInList) {
            editBuilder.insert(originalPosition, result.openQuoteCharacter + ' \\');
        } else {
            editBuilder.insert(originalPosition, result.openQuoteCharacter);
        }
        
        // Consider VS Code made margin
        let realMargin = result.margin - newPosition.character;
        if (realMargin > 0) {
            editBuilder.insert(newPosition, ' '.repeat(realMargin));
        }

        editBuilder.insert(newPosition, result.openQuoteCharacter);
    }
}
