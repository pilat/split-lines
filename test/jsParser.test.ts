import { applyEditCase } from "./common";
import { EndOfLine } from "vscode";


suite("JavaScript Language Parser Test", () => {
    test('Basic', async () => {
        const text = `var a = "Blabl bla"`;
        const expected = `
var a = "Blabl " +
        "bla"`.substr(1)
        await applyEditCase('js', text, expected, [0, 15])
    });

    test('In function', async () => {
        const text = `
function bee() {
    alert('Hello, World!');
}`.substr(1)
        const expected = `
function bee() {
    alert('Hello, ' +
          'World!');
}`.substr(1)
        await applyEditCase('js', text, expected, [1, 18])
    });

    test('Multiline in function', async () => {
        const text = `
function bee() {
    alert('Hello, ' + a + 
             'World and Newline!');
}`.substr(1)
        const expected = `
function bee() {
    alert('Hello, ' + a + 
             'World and ' +
             'Newline!');
}`.substr(1)
        await applyEditCase('js', text, expected, [2, 24])
    });

    test('React', async () => {
        const text = `
function render() {
    return <ReactTag prop1="dasdasdsadas" prop2="Hello, World!" />
}`.substr(1)
        const expected = `
function render() {
    return <ReactTag prop1="dasdasdsadas" prop2="Hello, " +
                                                "World!" />
}`.substr(1)
        await applyEditCase('js', text, expected, [1, 56])
    });

    test('In method', async () => {
        const text = `
function render() {
    return method('dsadas', 'Hello, World!');
}`.substr(1)
        const expected = `
function render() {
    return method('dsadas', 'Hello, ' +
                            'World!');
}`.substr(1)
        await applyEditCase('js', text, expected, [1, 36])
    });

    test('Input CRLF in LF document', async () => {
        const text = 'In a galaxy far far away'
        const expected = 'In a galaxy \nfar far away'
        await applyEditCase('js', text, expected, [0, 12], '\r\n')
    });

    test('Input CRLF in CRLF document', async () => {
        const text = 'In a galaxy far far away'
        const expected = 'In a galaxy \r\nfar far away'
        await applyEditCase('js', text, expected, [0, 12], '\r\n', EndOfLine.CRLF)
    });

    test('Input LF in CRLF document', async () => {
        const text = 'In a galaxy far far away'
        const expected = 'In a galaxy \r\nfar far away'
        await applyEditCase('js', text, expected, [0, 12], '\n', EndOfLine.CRLF)
    });

    test('Boundary punctuation', async () => {
        const text = "cll('dasdasdasdas', 'dasdasas')"
        const expected = "cll(\n'dasdasdasdas', 'dasdasas')"
        await applyEditCase('js', text, expected, [0, 4])
    });
});


suite("JSX Language Parser Test", () => {
    test('Basic', async () => {
        const text = 'let component = <ReactComponent value1="The string one two" />;';
        const expected = `
let component = <ReactComponent value1="The string " +
                                       "one two" />;`.substr(1)
        await applyEditCase('jsx', text, expected, [0, 51])
    });
});


suite("TypeScript Language Parser Test", () => {
    test('Basic', async () => {
        const text = 'let a:string = "Blabl bla"';
        const expected = `
let a:string = "Blabl " +
               "bla"`.substr(1)
        await applyEditCase('ts', text, expected, [0, 22])
    });

    test('Multiline in function', async () => {
        const text = `
class Hello {
    public test() {
        this.method('Hello, ' +
                    'World and newline');
    }
    private method(s: string) {}
}`.substr(1);
        const expected = `
class Hello {
    public test() {
        this.method('Hello, ' +
                    'World and ' +
                    'newline');
    }
    private method(s: string) {}
}`.substr(1)
        await applyEditCase('ts', text, expected, [3, 31])
    });
});
