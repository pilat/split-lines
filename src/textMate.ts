import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { existsSync } from 'fs';
import { IRawGrammar, IGrammar, Registry } from 'vscode-textmate';
import { readFile, download, writeFile } from './utils';
import { IGrammarCandidate } from './types';

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
    private _lang2Scope: Map<string, string> = new Map();  // languageId -> 1st scope
    private _scope2Candidate: Map<string, IGrammarCandidate> = new Map();  // scopeName -> candidate
    private _registry: Registry;
    private static instance: TextMateRegistry;

    // summon black-magic. Otherwise we would have problems with oniguruma on each platform
    private vsctm:IVirtualVsctm = require(path.join(vsCodeNodePath, 'vscode-textmate', 'release', 'main.js'));

    constructor() {
        this.setupCandidates()
        this.setupRegistry()
    }

    static getInstance() {
        if (!TextMateRegistry.instance) {
            TextMateRegistry.instance = new TextMateRegistry();
        }
        return TextMateRegistry.instance;
    }

    public loadGrammar(languageId: string): Promise<IGrammar | undefined> {
        // convert language to scope name
        const scopeName: string = this._lang2Scope.get(languageId);
        if (!scopeName) {
            return Promise.reject('Language is not supporting')
        }
        const o: IGrammarCandidate|undefined = this._scope2Candidate.get(scopeName);
        if (!o) {
            return Promise.reject('Language is not supporting')
        }
        return this._registry.loadGrammar(o.scopeName) as Promise<IGrammar | undefined>;
    }

    public addGrammar(languageId: string, scopeName: string, path?: string, url?: string, overwrite?: boolean) {
        const candidate: IGrammarCandidate = {
            languageId,
            scopeName,
            path,
            url
        }

        if (!this._lang2Scope.has(languageId) || overwrite) {
            this._lang2Scope.set(languageId, scopeName)
        }

        if (!this._scope2Candidate.has(scopeName) || overwrite) {
            this._scope2Candidate.set(scopeName, candidate)
        }
    }

    private setupCandidates() {
        for (const x of vscode.extensions.all) {
            if (!x.extensionPath || !x.packageJSON || !x.packageJSON.contributes) {
                continue
            }

            // TODO: Maybe promlem there.. Only 1st mentioned language/scope will be registered
            for (const gram of x.packageJSON.contributes.grammars || []) {
                const gramPath: string = path.join(x.extensionPath, gram.path);
                if (gram.scopeName) {
                    this.addGrammar(gram.language || gram.scopeName, gram.scopeName, gramPath)
                }
            }
        }
    }

    private setupRegistry() {
        // The new way with vscode-textmate v. > 4
        this._registry = new this.vsctm.Registry({ loadGrammar: this._loadGrammar.bind(this) });
    }

    private async _loadGrammar(scopeName: string): Promise<IRawGrammar | undefined> {
        const gram: IGrammarCandidate|undefined = this._scope2Candidate.get(scopeName);
        try{
            if (!gram) {
                throw new Error('Grammar not found');
            }

            if (!gram.path && gram.url) {
                await this._downloadGrammar(gram)
            }

            const content = await readFile(gram.path)
            const rawGrammar = this.vsctm.parseRawGrammar(content, gram.path);
            return rawGrammar
        } catch(e) {
            return
        }
    }

    private async _downloadGrammar(gram: IGrammarCandidate) {
        // get to temp
        const tempdir = os.tmpdir();
        try {
            fs.mkdirSync(tempdir);
        } catch(e) {
            // noop
        }

        const path_: string = path.join(tempdir, `temp-gram-${gram.scopeName}.json`);
        if (!fs.existsSync(path_)) {
            const content = await download(gram.url)
            await writeFile(path_, content);
        }
        gram.path = path_
    }
}