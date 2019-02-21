import { LanguageParser } from './../src/parser';
import * as assert from 'assert';
import {mock,restore} from 'simple-mock';
import { TextMateRegistry } from '../src/textMate';


suite("Parser Tests", () => {
    test('get parser w/o error', /*(done)*/ async () => {
        const parser = new LanguageParser('python');
        await parser.grammarPromise;
        assert.equal(parser.isReady, true);
    }),

    test('get parser w error', /*(done)*/ async () => {
        const parser = new LanguageParser('unknownLanguage');
        await parser.grammarPromise;
        assert.equal(parser.isReady, false);
    }),

    test('get parser with error 1', /*(done)*/ async () => {
        const registry = new TextMateRegistry();
        mock((registry as any).vsctm, 'parseRawGrammar',  (_, __) => {throw 'err'});

        const parser = new LanguageParser('unknownLanguage', registry);
        await parser.grammarPromise;
        restore()
        assert.equal(parser.isReady, false);
    }),

    test('get parser with error 2', /*(done)*/ async () => {
        const registry = new TextMateRegistry();
        mock((registry as any), 'loadGrammar',  (_) => new Promise((r) => {r('invalid')}));

        const parser = new LanguageParser('python', registry);
        await parser.grammarPromise;
        restore()
        assert.equal(parser.isReady, false);
    })
})
