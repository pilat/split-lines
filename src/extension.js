import vscode from 'vscode';

import {DocumentParser} from './document';
import { getTextMateRegistry } from './vsctm';
import { getAvailableParsers } from './parsers';


let availableParsers = {};
let textMateRegistry;
let documents = new Map();  // [document.uri] -> DocumentParser instances


export function activate(context) {
    textMateRegistry = getTextMateRegistry()
    availableParsers = getAvailableParsers();

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
        const grammar = await textMateRegistry.loadGrammar(scopeName);
        const parser = getSuitableParser(grammar);
        
        documents.set(doc.uri, parser);
    }catch(e) {
        console.warn(e);
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
    }catch(e) { }
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
            return matchingLanguages[0].scopeName;
        }
    } catch(e) { }
    return undefined;
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
