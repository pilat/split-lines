import { IGrammarExtension } from './types';
import * as vscode from 'vscode';
import * as path from 'path';
import { existsSync, readFile } from 'fs';
import { IRawGrammar, IGrammar, Registry } from 'vscode-textmate';

/**
 * VS Code TextMate: https://github.com/Microsoft/vscode-textmate
 * See also https://github.com/Microsoft/vscode/issues/580
 * https://github.com/siegebell/scope-info/blob/master/src/extension.ts
 */


let vsCodeNodePath = path.join(require.main.filename, '../../node_modules');
if (!existsSync(vsCodeNodePath)) {
    vsCodeNodePath += '.asar';
}


interface IVirtualVsctm {
    parseRawGrammar: (content: string, filePath: string) => IRawGrammar;
    Registry: typeof Registry;
}

export class TextMateRegistry {
    private collection: IGrammarExtension[] = [];
    private _registry:any;
    private static instance: TextMateRegistry;

    // summon black-magic. Otherwise we would have problems with oniguruma on each platform
    private vsctm:IVirtualVsctm = require(path.join(vsCodeNodePath, 'vscode-textmate', 'release', 'main.js'));

    constructor() {
        this.setupCollection()
        this.setupRegistry()
    }

    static getInstance() {
        if (!TextMateRegistry.instance) {
            TextMateRegistry.instance = new TextMateRegistry();
        }
        return TextMateRegistry.instance;
    }

    private setupCollection() {
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

    private setupRegistry() {
        // The new way with vscode-textmate v. > 4
        // @ts-ignore
        this._registry = new this.vsctm.Registry({
            loadGrammar: (scopeName: string) => {
                const ext = this.getByScope(scopeName);
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
                                const rawGrammar = this.vsctm.parseRawGrammar(content.toString(), ext.extPath);
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

    public loadGrammar(scopeName: string): Promise<IGrammar> {
        return this._registry.loadGrammar(scopeName);
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