import * as assert from 'assert';
import { readFile, writeFile, download } from "../src/utils";
import { createRandomFile, rndName } from './common';
import * as os from 'os';
import { join } from 'path';


suite("Test utils", () => {
    test('Read existing file', async () => {
        const tempFile = await createRandomFile('any', 'txt');
        const f = await readFile(tempFile.fsPath)
        assert.ok(f === 'any')
    });

    test('Read unexisting file', async () => {
        try {
            await readFile('not_found_file');
            assert.ok(false)
        } catch (e) {
            assert.ok(true)
        }
    });

    test('Write normal file', async () => {
        const content = Math.random().toString()
        const tmpFile = join(os.tmpdir(), rndName() + '.tmp');
        await writeFile(tmpFile, content)
        assert.ok(await readFile(tmpFile) === content)
    });

    test('Write file with error', async () => {
        try {
            await writeFile('https://invalid_path.local', 'any')
            assert.ok(false)
        } catch (e) {
            assert.ok(true)
        }
    });

    test('Download existing file', async () => {
        const content = await download('https://www.google.com/robots.txt');
        assert.ok(content.indexOf('Disallow') !== -1)
    });

    test('Download from invalid url', async () => {
        try {
            await download('https://localhost/a/b/c.txt');
            assert.ok(false)
        } catch (e) {
            assert.ok(true)
        }
    });
});
