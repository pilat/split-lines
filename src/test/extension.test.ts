import { SplitLinesProvider } from './../provider';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { createRandomFile, deleteFile } from './common';


const testCases:any = {
    php: [ // PHP
        {
            name: 'Test One',
            text: `
<?php

$text="line1\\r\\n" .
      "line2\\r\\n" .
      "line3\\r\\n";
`.substr(1),
            enterPos: [2, 11],
            expected: `
<?php

$text="line" .
      "1\\r\\n" .
      "line2\\r\\n" .
      "line3\\r\\n";
`.substr(1)
        },
        {
            name: 'Test With cursor problem',
            text: `
<?php

$text="line1+" .
      "line2+" .
      "line3+";
`.substr(1),
            enterPos: [3, 11],
            expected: `
<?php

$text="line1+" .
      "line" .
      "2+" .
      "line3+";
`.substr(1)
        }
    ],



    py: [ // Python
        {
            name: 'Test with fileType',
            text: 'a = "Long string test"', 
            enterPos: [0, 10], 
            expected: `
a = "Long " \\
    "string test"`.substr(1)
        },
        {
            name: 'Test with single quotes',
            text: "a = 'Long string test'", 
            enterPos: [0, 10], 
            expected: `
a = 'Long ' \\
    'string test'`.substr(1)
        },
        {
            name: 'Test with braces',
            text: "method('Long string test')", 
            enterPos: [0, 13], 
            expected: `
method('Long '
       'string test')`.substr(1)
        },
        {
            name: 'Test in list',
            text: "a = ['aaaa', 'Long string test']", 
            enterPos: [0, 19], 
            expected: `
a = ['aaaa', 'Long '
             'string test']`.substr(1)
        },
        {
            name: 'Test in comment strings',
            text: `
"""
Special string
""""`.substr(1), 
            enterPos: [1, 8], 
            expected: `
"""
Special 
string
""""`.substr(1)
        },
        {
            name: 'Test in method argument',
            text: 'method("Hello", "World!")',
            enterPos: [0, 17],
            expected: `
method("Hello", ""
                "World!")`.substr(1)
        },
        {
            name: 'Test mutliline expression',
            text: `
method("Argument1", 
       "argument2",
                "argument3", "argument_number_4")`.substr(1),
            enterPos: [2, 38],
            expected: `
method("Argument1", 
       "argument2",
                "argument3", "argument"
                             "_number_4")`.substr(1)
        },
        {
            name: 'Test with margin correction with backslash',
            text: `
def method():
    return 'Long text'`.substr(1),
            enterPos: [1, 17],
            expected: `
def method():
    return 'Long ' \\
           'text'`.substr(1)
        },
        {
            name: 'Test with margin correction (in braces)',
            text: `
def method():
    return ('Long text')`.substr(1),
            enterPos: [1, 18],
            expected: `
def method():
    return ('Long '
            'text')`.substr(1)
        },
        {
            name: 'Test when start from 0 position',
            text: `
return ('Long text')`.substr(1),
            enterPos: [0, 14],
            expected: `
return ('Long '
        'text')`.substr(1)
        },
        {
            name: 'Test broken 1',
            text: `
message = 'Hello! This message is too long to fit in one line. ' \\
          'To break it, you can press Enter right in the middle.'`.substr(1),
          enterPos: [1, 57],
          expected: `
message = 'Hello! This message is too long to fit in one line. ' \\
          'To break it, you can press Enter right in the ' \\
          'middle.'`.substr(1),
        }
    ],

    js: [  // JS
        {
            name: 'Basic',
            text: 'var a = "Blabl bla"',
            enterPos: [0, 15],
            expected: `
var a = "Blabl " +
        "bla"`.substr(1)
        },
        {
            name: 'In function',
            text: `
function bee() {
    alert('Hello, World!');
}`.substr(1),
            enterPos: [1, 18],
            expected: `
function bee() {
    alert('Hello, ' +
          'World!');
}`.substr(1)
        },
        {
            name: 'Multiline in function',
            text: `
function bee() {
    alert('Hello, ' + a + 
             'World and Newline!');
}`.substr(1),
            enterPos: [2, 24],
            expected: `
function bee() {
    alert('Hello, ' + a + 
             'World and ' +
             'Newline!');
}`.substr(1)
        },
        {
            name: 'React',
            text: `
function render() {
    return <ReactTag prop1="dasdasdsadas" prop2="Hello, World!" />
}`.substr(1),
            enterPos: [1, 56],
            expected: `
function render() {
    return <ReactTag prop1="dasdasdsadas" prop2="Hello, " +
                                                "World!" />
}`.substr(1)
        },
        {
            name: 'In method',
            text: `
function render() {
    return method('dsadas', 'Hello, World!');
}`.substr(1),
            enterPos: [1, 36],
            expected: `
function render() {
    return method('dsadas', 'Hello, ' +
                            'World!');
}`.substr(1)
        },
        {
            name: 'Input CRLF in LF document',
            text: 'In a galaxy far far away',
            enterPos: [0, 12], 
            input: '\r\n',  // unusual input
            expected: 'In a galaxy \nfar far away'
        },
        {
            name: 'Input CRLF in CRLF document',
            text: 'In a galaxy far far away',
            enterPos: [0, 12], 
            input: '\r\n',
            eol: vscode.EndOfLine.CRLF,
            expected: 'In a galaxy \r\nfar far away'
        },
        {
            name: 'Input LF in CRLF document',
            text: 'In a galaxy far far away',
            enterPos: [0, 12], 
            input: '\n',
            eol: vscode.EndOfLine.CRLF,
            expected: 'In a galaxy \r\nfar far away'
        },
    ],

    jsx: [  // JS
        {
            name: 'Basic',
            text: 'let component = <ReactComponent value1="The string one two" />;',
            enterPos: [0, 51],
            expected: `
let component = <ReactComponent value1="The string " +
                                       "one two" />;`.substr(1)
        },
    ],


    ts: [  // TypeScript
        {
            name: 'Basic',
            text: 'let a:string = "Blabl bla"',
            enterPos: [0, 22],
            expected: `
let a:string = "Blabl " +
               "bla"`.substr(1)
        },
        {
            name: 'Multiline in function',
            text: `
class Hello {
    public test() {
        this.method('Hello, ' +
                    'World and newline');
    }
    private method(s: string) {}
}`.substr(1),
            enterPos: [3, 31],
            expected: `
class Hello {
    public test() {
        this.method('Hello, ' +
                    'World and ' +
                    'newline');
    }
    private method(s: string) {}
}`.substr(1)
        }
    ]
};

    
suite("Extension Tests", () => {
    test('Base test', async () => {
        // noop
    });
    
    // todo: test with overtype plugins like this https://marketplace.visualstudio.com/items?itemName=adammaras.overtype

    for (let fileType in testCases) {
        for (let testCase of testCases[fileType]) {
            test(fileType + ': ' + testCase.name, async () => {
                const myExtension = vscode.extensions.getExtension('brainfit.split-lines');
                await myExtension.activate();
                let myProvider:SplitLinesProvider = myExtension.exports.getProvider();

                const file = await createRandomFile(testCase.text, fileType);
                const doc = await vscode.workspace.openTextDocument(file);
                const ed = await vscode.window.showTextDocument(doc);

                const input = testCase.input || '\n';
                await ed.edit(builder => {
                    builder.setEndOfLine(testCase.eol || vscode.EndOfLine.LF);
                    builder.insert(new vscode.Position(testCase.enterPos[0], testCase.enterPos[1]), input);
                })
                await myProvider.editPromise;

                // await doc.save();  // Force onDidChangeTextDocument
                
                let actualText = doc.getText();
                assert.equal(actualText, testCase.expected);
                
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                await deleteFile(file);
                
                return true;
            });
        }
    }

    for (let pos=10;pos<26;++pos){  // Check boundary issue
        test(`Multicursor, boundaty check (offset {pos})`, async () => {
        const myExtension = vscode.extensions.getExtension('brainfit.split-lines');
        await myExtension.activate();
        let myProvider:SplitLinesProvider = myExtension.exports.getProvider();

        const doc = await vscode.workspace.openTextDocument({language: 'javascript'});
        const ed = await vscode.window.showTextDocument(doc);
        const text = "var a=   '123456789012345';  // 0 - 20\nvar b=   '123456789012345';\n";
        // const pos = 20;

        await ed.edit(builder => {
            //builder.setEndOfLine(testCase.eol || vscode.EndOfLine.LF);  // TODO: New line as a fixture
            builder.insert(new vscode.Position(0, 0), text);
        });
        
        // let newPosition = vscode.Position(0, 20);
        // ed.selection = new vscode.Selection(0, 20, 0, 20);
        // await sleep(150);
        // vscode.commands.executeCommand('editor.action.insertCursorBelow');
        // await sleep(150);

        // Press enter
        //vscode.workspace.applyEdit()
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
