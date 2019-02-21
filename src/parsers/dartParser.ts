import { IParserResult } from './../types';
import { DocumentParser, LineFragment } from './common';
import { TextEditorEdit } from 'vscode';


interface IDartResolveResult {
    openQuoteCharacter: string;
    margin: number;
}


export class DartDocumentParser extends DocumentParser {
    public static SUPPORTED_GRAMMARS = ['source.dart', 'Dart'];
    private readonly ALLOWED_CHARS = ["'", '"', "r'", 'r"'];

    public resolve(fragment:LineFragment, prevFragments:LineFragment[]): IDartResolveResult | undefined {
        const REGEX = /^string\.(quoted|interpolated)\.(single|double)(\.dart)$/;
        if (!fragment.isScope(REGEX)) {
            return
        }

        const fragmentName = fragment.scopes[fragment.scopes.length - 1];

        if (fragmentName === undefined) {
            return
        }

        // backward search and detect open quote character(s)
        const startQuoteFragment = [...prevFragments].reverse().find(
            (i) => i.isScope(fragmentName) && this.ALLOWED_CHARS.indexOf(i.text) !== -1)
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
        const result = item.result as IDartResolveResult;

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
