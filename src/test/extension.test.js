import * as assert from 'assert';
import * as vscode from 'vscode';
import { workspace, window, Position, Range, commands, TextEditor, TextDocument, TextEditorCursorStyle, TextEditorLineNumbersStyle, SnippetString, Selection } from 'vscode';
import { createRandomFile, deleteFile } from './utils';


const testCases = {
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
        }
    ]
};

    
suite("Extension Tests", () => {
    for (let fileType in testCases) {
        for (let testCase of testCases[fileType]) {
            test(fileType + ': ' + testCase.name, async () => {
                const myExtension = vscode.extensions.getExtension('brainfit.split-lines');
                await myExtension.activate();

                const file = await createRandomFile(testCase.text, fileType);
                const doc = await vscode.workspace.openTextDocument(file);            
                const ed = await vscode.window.showTextDocument(doc);

                await ed.edit(builder => {
                    builder.insert(new Position(testCase.enterPos[0], testCase.enterPos[1]), '\n');
                })            
                
                await doc.save();  // Force onDidChangeTextDocument
                
                let actualText = doc.getText();
                assert.equal(actualText, testCase.expected);
                
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                await deleteFile(file);
                
                return true;
            });
        }
    }
});