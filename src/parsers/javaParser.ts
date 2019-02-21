import { IParserResult } from './../types';
import { DocumentParser, LineFragment } from './common';
import { TextEditorEdit } from 'vscode';


interface IJavaResolveResult {
    openQuoteCharacter: string;
    margin: number;
}


export class JavaDocumentParser extends DocumentParser {
    public static SUPPORTED_GRAMMARS = ['Java', 'source.java'];

    public resolve(fragment:LineFragment, prevFragments:LineFragment[]): IJavaResolveResult | undefined {
        const isInString:boolean = fragment.hasScope(/^string\.quoted\.(single|double)(\.java)$/);
        
        if (!isInString) {
            return;
        }
        
        if (fragment.isScope(/^punctuation\.definition\.string\.begin(\.java)$/)) {
            return;
        }

        // backward search for detect quote character(s)
        const startQuoteFragment = [...prevFragments].reverse().find(
            (i) => i.isScope(/^punctuation\.definition\.string\.begin(\.java)$/));
        if (!startQuoteFragment) {
            return;
        }
        
        let margin:number = 0;
        const openQuoteCharacter:string = startQuoteFragment.text;
        margin = startQuoteFragment.startIndex;

        return {openQuoteCharacter, margin};
    }

    public edit(editBuilder:TextEditorEdit, item:IParserResult):number {
        const { originalPosition, newPosition } = item.event;
        const result = item.result as IJavaResolveResult;

        editBuilder.insert(originalPosition, result.openQuoteCharacter + ' +');
        
        // Consider VS Code made margin
        let realMargin = result.margin - newPosition.character;
        if (realMargin > 0) {
            editBuilder.insert(newPosition, ' '.repeat(realMargin));
        }

        editBuilder.insert(newPosition, result.openQuoteCharacter);
        return 0;
    }
}
