import {mock,restore} from 'simple-mock';
import { TextMateRegistry } from '../src/textMate';


suite("TextMate Tests", () => {
    test('get existing grammar w/o error', (done) => {
        const registry = new TextMateRegistry();
        registry.loadGrammar('javascript').then(() => done(), () => done('Failed'))
    }),

    test('get unknown grammar with error', (done) => {
        const registry = new TextMateRegistry();
        registry.loadGrammar('unknownLanguage').then(() => done('Failed'), () => done())
    }),

    test('get existing grammar with error', (done) => {
        const registry = new TextMateRegistry();
        registry.addGrammar('javascript', 'source.js', 'not-existing-path', undefined, true);  // replace existing
        registry.loadGrammar('javascript').then(() => {
            done('Failed');
        }, () => {
            done()
        })
    }),

    test('get currupted grammar with error', (done) => {
        const registry = new TextMateRegistry();
        mock((registry as any).vsctm, 'parseRawGrammar',  (_, __) => {throw 'err'});
        registry.loadGrammar('javascript').then(() => {
            restore();
            done('Failed');
        }, () => {
            restore();
            done()
        })
    })
})
