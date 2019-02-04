import { DocumentParser, LineFragment } from './common';
import { Position, TextEditorEdit } from 'vscode';


interface IJSResolveResult {
    isInString: boolean;
    openQuoteCharacter: string;
    margin: number;
}


export class JSDocumentParser extends DocumentParser {
    public static SUPPORTED_GRAMMARS = ['JavaScript (with React support)', 'TypeScript', 'TypeScriptReact'];

    public resolve(fragment:LineFragment, prevFragments:LineFragment[]): IJSResolveResult | undefined {
        const isInString:boolean = fragment.hasScope(/^string\.quoted\.(single|double)(\.js(\.jsx)?|\.tsx?)$/);
        
        if (!isInString) {
            return;
        }
        
        if (fragment.isScope(/^punctuation\.definition\.string\.begin(\.js(\.jsx)?|\.tsx?)$/)) {
            return;
        }

        // backward search for detect quote character(s)
        const startQuoteFragment = [...prevFragments].reverse().find(i => 
            i.isScope(/^punctuation\.definition\.string\.begin(\.js(\.jsx)?|\.tsx?)$/));
        if (!startQuoteFragment) {
            return;
        }
        
        let margin:number = 0;
        const openQuoteCharacter:string = startQuoteFragment.text;
        margin = startQuoteFragment.startIndex;

        return {isInString, openQuoteCharacter, margin};
    }

    public edit(editBuilder:TextEditorEdit, originalPosition:Position, newPosition:Position, result:IJSResolveResult): void {
        editBuilder.insert(originalPosition, result.openQuoteCharacter + ' +');
        
        // Consider VS Code made margin
        let realMargin = result.margin - newPosition.character;
        if (realMargin > 0) {
            editBuilder.insert(newPosition, ' '.repeat(realMargin));
        }

        editBuilder.insert(newPosition, result.openQuoteCharacter);
    }
}
