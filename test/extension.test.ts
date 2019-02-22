import { SplitLinesProvider } from '../src/provider';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { closeAllEditors } from './common';


suite("Extension Tests", () => {
    teardown(async () => {
        await closeAllEditors();
    })
    // todo: test with overtype plugins like this https://marketplace.visualstudio.com/items?itemName=adammaras.overtype

    for (let pos=10;pos<26;++pos){  // Check boundary issue
        test(`Multicursor, boundaty issue. Check with offset ${pos}`, async () => {
        const myExtension = vscode.extensions.getExtension('brainfit.split-lines');
        await myExtension.activate();
        let myProvider:SplitLinesProvider = myExtension.exports.getProvider();

        const doc = await vscode.workspace.openTextDocument({language: 'javascript'});
        const ed = await vscode.window.showTextDocument(doc);
        const text = "var a=   '123456789012345';  // 0 - 20\nvar b=   '123456789012345';\n";

        await ed.edit(builder => {
            //builder.setEndOfLine(testCase.eol || vscode.EndOfLine.LF);  // TODO: New line as a fixture
            builder.insert(new vscode.Position(0, 0), text);
        });
        
        // Press enter
        await ed.edit(builder => {
            builder.insert(new vscode.Position(0, pos), "\n");
            builder.insert(new vscode.Position(1, pos), "\n");
        });
        await myProvider.editPromise;

        // expected value:
        let actualText = doc.getText();

        const expected = text.split('\n').map(line => 
            line ? line.substr(0, pos) + "' +\n" + ' '.repeat(9) + "'" + line.substr(pos) : ''
        ).join('\n')

        assert.equal(actualText, expected);
        });
    }
});
