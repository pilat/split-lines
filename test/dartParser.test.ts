import { applyEditCase } from "./common";
import { TextMateRegistry } from "../src/textMate";


suite("Dart Parser Test", () => {
    setup(async () => {
        const tm = TextMateRegistry.getInstance();
        tm.addGrammar('plaintext', 'source.dart', undefined, // dart
            'https://raw.githubusercontent.com/oscarcs/dart-syntax-highlighting-only/master/syntaxes/dart.json', true)
    });

    test('Single quotes', async () => {
        const text = `
var s1 = 'Single quotes work well for string literals.';`.substr(1);
        const expected = `
var s1 = 'Single quotes ' +
         'work well for string literals.';`.substr(1)
        await applyEditCase('dart', text, expected, [0, 24])
    });

    test('Double quotes', async () => {
        const text = `
var s2 = "Double quotes work just as well.";`.substr(1)
        const expected = `
var s2 = "Double quotes work just " +
         "as well.";`.substr(1)
        await applyEditCase('dart', text, expected, [0, 34])
    });

    test('Not applies for variables', async () => {
        const text = `var s = 'That deserves all caps. ' +
        '\${s.toUpperCase()} is very handy!';`.substr(1);
        const expected = `var s = 'That deserves all caps. ' +
        '\${s.toU
pperCase()} is very handy!';`.substr(1)
        await applyEditCase('dart', text, expected, [1, 16])
    });

    test('Not for multiline strings', async () => {
        const text = `var s1 = '''
You can create
multi-line strings like this one.
''';`.substr(1)
        const expected = `var s1 = '''
You can 
create
multi-line strings like this one.
''';`.substr(1)
        await applyEditCase('dart', text, expected, [1, 8])
    });
});
