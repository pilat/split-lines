import {mock, restore} from 'simple-mock';
import { TextMateRegistry } from '../src/textMate';
import * as assert from 'assert';


suite("TextMate Tests", () => {
    let registry: TextMateRegistry;

    setup(async() => {
        registry = new TextMateRegistry();
    });

    test('Get existing grammar w/o error', (done) => {
        registry.loadGrammar('javascript').then(() => done(), () => done('Failed'))
    });

    test('Get unknown grammar with error', (done) => {
        registry.loadGrammar('unknownLanguage').then(
            () => done('Failed'),
            () => done())
    });

    test('Get unknown grammar directly', (done) => {
        // @ts-ignore Access to private
        registry._registry.loadGrammar('unknownLanguage').then(
            () => done('Failed'),
            () => done())
    });

    test('Get existing grammar with error', (done) => {
        registry.addGrammar('javascript', 'source.js', 'not-existing-path', undefined, true);  // replace existing
        registry.loadGrammar('javascript').then(() => {
            done('Failed');
        }, () => {
            done()
        })
    });

    test('Get currupted grammar with error', (done) => {
        // @ts-ignore Test access to private
        mock(registry.vsctm, 'parseRawGrammar',  (_, __) => {throw 'err'});
        registry.loadGrammar('javascript').then(() => {
            restore();
            done('Failed');
        }, () => {
            restore();
            done()
        })
    });
});

suite('TextMate Tests (2)', () => {
    let registry: TextMateRegistry;
    let mocked: any;

    setup(async() => {
        registry = new TextMateRegistry();
        registry.addGrammar('ECL', 'source.ecl', undefined,
            'https://raw.githubusercontent.com/hpcc-systems/vscode-ecl/master/syntaxes/ecl.tmLanguage.json', true);
            mocked = mock(registry, '_downloadGrammar')
    });

    teardown(async () => {
        restore();
    });

    test('Download grammar', async () => {
        await registry.loadGrammar('ECL');
        await registry.loadGrammar('ECL');  // 2nd time load from cache
        assert.ok(mocked.callCount === 1);
    });
})
