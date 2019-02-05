import * as vscode from 'vscode';
import * as path from 'path';
import { existsSync, readFile } from 'fs';
import { IRawGrammar, IGrammar, Registry } from 'vscode-textmate';

/**
 * VS Code TextMate: https://github.com/Microsoft/vscode-textmate
 * See also https://github.com/Microsoft/vscode/issues/580
 * https://github.com/siegebell/scope-info/blob/master/src/extension.ts
 */


interface IVirtualVsctm {
    parseRawGrammar: (content: string, filePath: string) => IRawGrammar;
    Registry: typeof Registry;
}


let vsCodeNodePath = path.join(require.main.filename, '../../node_modules');
if (!existsSync(vsCodeNodePath)) {
    vsCodeNodePath += '.asar';
}


export interface ITextMateRegistry {
    loadGrammar(scopeName: string): Promise<IGrammar>;
}

interface IGrammarExtension {
    extPath: string;
    language: string;
    scopeName: string;
    extension: vscode.Extension<any>;
}

class GrammarExtensionCollection {
    private collection: IGrammarExtension[] = [];

    constructor() {
        this.collection = vscode.extensions.all
        .filter((x) => x.extensionPath && x.packageJSON &&
            x.packageJSON.contributes && x.packageJSON.contributes.grammars)
        .reduce((prev, cur) => [
            ...prev,
            ...cur.packageJSON.contributes.grammars.map((gram:any) => {
                return {
                    extPath: path.join(cur.extensionPath, gram.path),
                    language: gram.language,
                    scopeName: gram.scopeName,
                    extension: cur,
                };
            }),
        ], []);
    }

    public getByLanguage(languageId:string):IGrammarExtension | undefined {
        const matchingLanguages = this.collection.filter((g) => g.language === languageId);

        if(matchingLanguages.length > 0) {
            return matchingLanguages[0];
        }
    }

    public getByScope(scopeName:string):IGrammarExtension | undefined {
        const matchingExtensions = this.collection.filter((g) => g.scopeName === scopeName);
        if(matchingExtensions.length > 0) {
            return matchingExtensions[0];
        }
    }
}

export const grammarCollection = new GrammarExtensionCollection();


export function getTextMateRegistry(): ITextMateRegistry {
    // summon black-magic. Otherwise we would have problems with oniguruma on each platform
    const vsctm:IVirtualVsctm = require(path.join(vsCodeNodePath, 'vscode-textmate', 'release', 'main.js'));

    // The new way with vscode-textmate v. > 4
    // @ts-ignore
    return new vsctm.Registry({
        loadGrammar: (scopeName: string) => {
            const ext = grammarCollection.getByScope(scopeName);
            return new Promise((resolve, reject) => {
                if (!ext) {
                    reject();
                    return;
                }
                readFile(ext.extPath, (error, content) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            const rawGrammar = vsctm.parseRawGrammar(content.toString(), ext.extPath);
                            resolve(rawGrammar);
                        } catch(e) {
                            reject(e);
                        }
                    }
                });
            });
        }
    });
}
