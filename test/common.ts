import * as vscode from 'vscode';

import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';
import { SplitLinesProvider } from '../src/provider';
import * as assert from 'assert';
import { LanguageParser } from '../src/parser';


function rndName() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

export function createRandomFile(contents = '', ext=''): Promise<vscode.Uri> {
    return new Promise((resolve, reject) => {
        const tmpFile = join(os.tmpdir(), rndName() + (ext ? '.'+ext : ''));
        fs.writeFile(tmpFile, contents, (error) => {
            if (error) {
                return reject(error);
            }

            resolve(vscode.Uri.file(tmpFile));
        });
    });
}

export function pathEquals(path1: string, path2: string) {
    if (process.platform !== 'linux') {
        path1 = path1.toLowerCase();
        path2 = path2.toLowerCase();
    }

    return path1 === path2;
}

export function deleteFile(file: vscode.Uri) {
    return new Promise((resolve, reject) => {
        fs.unlink(file.fsPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

export function closeAllEditors() {
    return vscode.commands.executeCommand('workbench.action.closeAllEditors');
}

export function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export async function applyEditCase(fileType: string, text: string, expected: string,
    position: [number, number], input?: string, eol?: vscode.EndOfLine) {
    const myExtension = vscode.extensions.getExtension('brainfit.split-lines');
    await myExtension.activate();
    let myProvider: SplitLinesProvider = myExtension.exports.getProvider();

    const file = await createRandomFile(text, fileType);
    const doc = await vscode.workspace.openTextDocument(file);
    const ed = await vscode.window.showTextDocument(doc);

    // wait slow parsers
    const allParsers: LanguageParser[] = Array.from((myProvider as any).parsers.values());
    const grammarsPromises = allParsers.map(o => o.grammarPromise);
    await Promise.all(grammarsPromises);

    input = input || '\n';
    await ed.edit(builder => {
        builder.setEndOfLine(eol || vscode.EndOfLine.LF);
        builder.insert(new vscode.Position(position[0], position[1]), input);
    })
    await myProvider.editPromise;
    
    let actualText = doc.getText();
    assert.equal(actualText, expected);
    
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await deleteFile(file);
}
