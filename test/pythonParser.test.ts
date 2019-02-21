import { applyEditCase } from "./common";


suite("Python Language Parser Test", () => {
    test('Test with double quotes', async () => {
        const text = `a = "Long string test"`;
        const expected = `
a = "Long " \\
    "string test"`.substr(1)
        await applyEditCase('py', text, expected, [0, 10])
    });

    test('Test with single quotes', async () => {
        const text = `a = 'Long string test'`
        const expected = `
a = 'Long ' \\
    'string test'`.substr(1)
        await applyEditCase('py', text, expected, [0, 10])
    });

    test('Test with braces', async () => {
        const text = `method('Long string test')`
        const expected = `
method('Long '
       'string test')`.substr(1)
        await applyEditCase('py', text, expected, [0, 13])
    });

    test('Test in list', async () => {
        const text = `a = ['aaaa', 'Long string test']`
        const expected = `
a = ['aaaa', 'Long '
             'string test']`.substr(1)
        await applyEditCase('py', text, expected, [0, 19])
    });

    test('Test in comment strings', async () => {
        const text = `
"""
Special string
""""`.substr(1)
        const expected = `
"""
Special 
string
""""`.substr(1)
        await applyEditCase('py', text, expected, [1, 8])
    });

    test('Test in method argument', async () => {
        const text = `method("Hello", "World!")`
        const expected = `
method("Hello", ""
                "World!")`.substr(1)
        await applyEditCase('py', text, expected, [0, 17])
    });

    test('Test mutliline expression', async () => {
        const text = `
method("Argument1", 
       "argument2",
                "argument3", "argument_number_4")`.substr(1)
        const expected = `
method("Argument1", 
       "argument2",
                "argument3", "argument"
                             "_number_4")`.substr(1)
        await applyEditCase('py', text, expected, [2, 38])
    });

    test('Test with margin correction with backslash', async () => {
        const text = `
def method():
    return 'Long text'`.substr(1)
        const expected = `
def method():
    return 'Long ' \\
           'text'`.substr(1)
        await applyEditCase('py', text, expected, [1, 17])
    });

    test('Test with margin correction (in braces)', async () => {
        const text = `
def method():
    return ('Long text')`.substr(1)
        const expected = `
def method():
    return ('Long '
            'text')`.substr(1)
        await applyEditCase('py', text, expected, [1, 18])
    });

    test('Test when start from 0 position', async () => {
        const text = `
return ('Long text')`.substr(1)
        const expected = `
return ('Long '
        'text')`.substr(1)
        await applyEditCase('py', text, expected, [0, 14])
    });

    test('Test with long string', async () => {
        const text = `
message = 'Hello! This message is too long to fit in one line. ' \\
          'To break it, you can press Enter right in the middle.'`.substr(1)
        const expected = `
message = 'Hello! This message is too long to fit in one line. ' \\
          'To break it, you can press Enter right in the ' \\
          'middle.'`.substr(1)
        await applyEditCase('py', text, expected, [1, 57])
    });
});
