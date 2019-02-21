import * as fs from 'fs';
import * as https from 'https';


export function readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, content) => {
            if (error) {
                reject(error.message);
            } else {
                resolve(content.toString())
            }
        });
    })
}

export function writeFile(path: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, (error) => {
            if (error) {
                reject(error.message)
            } else {
                resolve();
            }
        })
    })
}

export function download(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data.toString());
            });

        }).on("error", (err) => {
            reject(err.message)
        });
    })
}