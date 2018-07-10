import vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import semver from 'semver';

// VS Code TextMate: https://github.com/Microsoft/vscode-textmate
// See also https://github.com/Microsoft/vscode/issues/580
let vsCodeNodePath = path.join(require.main.filename, '../../node_modules');
if (!fs.existsSync(vsCodeNodePath)) {
    vsCodeNodePath += '.asar';
}

const vsctm = require(path.join(vsCodeNodePath, 'vscode-textmate', 'release', 'main.js'));

export const getTextMateRegistry = () => {
    const grammars =
        vscode.extensions.all
        .filter(x => x.packageJSON && x.packageJSON.contributes && x.packageJSON.contributes.grammars)
        .reduce((a,b) => [...a, ...(b.packageJSON).contributes.grammars.map(x => Object.assign({extensionPath: b.extensionPath}, x))], []);

    if (semver.gte(vscode.version, '1.24.0')) {
        // The new way with vscode-textmate v. > 4
        return new vsctm.Registry({
            loadGrammar: (scopeName) => {
                const suitableExtensions = grammars.filter(g => g.scopeName === scopeName);
                if(suitableExtensions.length === 0)
                    return null;
        
                const firstSuitableExtension = suitableExtensions[0];
                const extPath = path.join(firstSuitableExtension.extensionPath, firstSuitableExtension.path);
                return new Promise((c, e) => {
                    fs.readFile(extPath, (error, content) => {
                        if (error) {
                            e(error);
                        } else {
                            const rawGrammar = vsctm.parseRawGrammar(content.toString(), extPath);
                            c(rawGrammar);
                        }
                    });
                });
            }
        });
    } else {
        // The old way:
        const textMateRegistry = new vsctm.Registry({
            getFilePath: (scopeName) => {
                const suitableExtensions = grammars.filter(g => g.scopeName === scopeName);
                if(suitableExtensions.length === 0)
                    return null;
        
                const firstSuitableExtension = suitableExtensions[0];
                return path.join(firstSuitableExtension.extensionPath, firstSuitableExtension.path);
            }
        });
        return {
            loadGrammar: (scopeName) => new Promise((resolve, reject) => {
                try {
                    textMateRegistry.loadGrammar(scopeName, (err, grammar) => {
                        if(err)
                            reject(err)
                        else
                            resolve(grammar);
                    })
                } catch(err) {
                    reject(err);
                }        
            })
        }
    }
}