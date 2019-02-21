import { applyEditCase } from "./common";


suite("Java Language Parser Test", () => {
    test('Single quotes', async () => {
        const text = `
String kk = 'Test 12345';`.substr(1);
        const expected = `
String kk = 'Test ' +
            '12345';`.substr(1)
        await applyEditCase('java', text, expected, [0, 18])
    });

    test('Double quotes', async () => {
        const text = `
System.out.println( "String Length is : " + len );`.substr(1);
        const expected = `
System.out.println( "String Length " +
                    "is : " + len );`.substr(1)
        await applyEditCase('java', text, expected, [0, 35])
    });

    test('Boundary 1', async () => {
        const text = `
String f = '12345'`.substr(1);
        const expected = `
String f = 
'12345'`.substr(1)
        await applyEditCase('java', text, expected, [0, 11])
    });

    test('Boundary 2', async () => {
        const text = `
String f = '12345'`.substr(1);
        const expected = `
String f = '12345' +
           ''`.substr(1)
        await applyEditCase('java', text, expected, [0, 17])
    });
});
