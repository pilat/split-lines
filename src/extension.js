import vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import {DocumentParser} from './document';

const PARSERS_DIR = path.join(__dirname, 'parsers');

// Use VS Code TextMate https://github.com/Microsoft/vscode/issues/580
const tm = require(path.join(require.main.filename, '../../node_modules/vscode-textmate/release/main.js'));

let availableParsers = {};
let textMateRegistry;
let documents = new Map();  // [document.uri] -> DocumentParser instances


export function activate(context) {    
    textMateRegistry = new tm.Registry(grammarLocator);

    for(let parserModule of parserModulesIterator())
        availableParsers = {...availableParsers, ...parserModule};
        
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(openDocument));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(changeDocument));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(closeDocument));

    for(const doc of vscode.workspace.textDocuments)
        openDocument(doc);
}

async function openDocument(doc) {
    const scopeName = getLanguageScopeName(doc.languageId);
    if (!scopeName)
        return;    

    try{
        // console.log('Load grammar for %s and find suitable parser', scopeName);
        const grammar = await loadGrammar(scopeName);
        const parser = getSuitableParser(grammar);
        
        documents.set(doc.uri, parser);
    }catch(err) {
        console.error(err);
    }
}

async function changeDocument(event) {
    const doc = documents.get(event.document.uri);
    if (!doc)
        return;

    const editor = vscode.window.activeTextEditor;
    try {
        for (let contentChange of event.contentChanges) {
            let callback = doc.getChanges(event.document, contentChange);
            if (callback) {                
                editor.edit(editBuilder => {
                    callback(editBuilder);                    
                });
            }
        }
    }catch(err) {
        console.error(err);
    }
}

function closeDocument(doc) {
    if (documents.has(doc.uri))
        documents.delete(doc.uri);
}

// https://github.com/siegebell/scope-info/blob/master/src/extension.ts
function getLanguageScopeName(languageId) {
    try {
        const languages =
            vscode.extensions.all
            .filter(x => x.packageJSON && x.packageJSON.contributes && x.packageJSON.contributes.grammars)
            .reduce((a, b) => [...a, ...(b.packageJSON).contributes.grammars], []);
        const matchingLanguages = languages.filter(g => g.language === languageId);
      
        if(matchingLanguages.length > 0) {
            // console.info(`Mapping language ${languageId} to initial scope ${matchingLanguages[0].scopeName}`);
            return matchingLanguages[0].scopeName;
        }
    } catch(err) { }
    return undefined;
}

const grammarLocator = {
    getFilePath: function (scopeName) {
        const grammars =
            vscode.extensions.all
            .filter(x => x.packageJSON && x.packageJSON.contributes && x.packageJSON.contributes.grammars)
            .reduce((a,b) => [...a, ...(b.packageJSON).contributes.grammars.map(x => Object.assign({extensionPath: b.extensionPath}, x))], []);
        
        const matchingLanguages = grammars.filter(g => g.scopeName === scopeName);
        if(matchingLanguages.length === 0)
            return null;

        const ext = matchingLanguages[0];
        const file = path.join(ext.extensionPath, ext.path);
        //console.info(`Found grammar for ${scopeName} at ${file}`);
        return file;
    }
};

function loadGrammar(scopeName) {
    return new Promise((resolve,reject) => {
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
    });
}

function* parserModulesIterator() {
    for (let file of fs.readdirSync(PARSERS_DIR)) {
        if (file.match(/\.js$/))
            yield require('./parsers/' + file);
    }
}

function getSuitableParser(grammar) {
    for (let parserName in availableParsers) {
        let parserModule = availableParsers[parserName];
        if (parserModule.probe(grammar))
            return new parserModule(grammar);
    }
    throw new Error('Suitable parser not found')
}


export function deactivate() {    
    textMateRegistry = null;
    availableParsers = {};
    documents.clear();
}
