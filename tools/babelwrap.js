const spawn = require('child_process').spawn;
const exec = require('child_process').execFile;
const path = require('path');


let babelArgs = process.argv.slice(2); // node file args


var filename = path.join(process.cwd(), 'node_modules/.bin/babel');
let newArgs = [filename, ...babelArgs];

var child = exec("node", newArgs, {stdio: 'inherit'}); 

// // use event hooks to provide a callback to execute when data are available: 
child.stdout.on('data', handle);
child.stderr.on('data', handle);


function handle(data) {
    // From most complex to simple:
    let regex2 = /(.+[Ee]rror): (.+): (.+) \((\d+):(\d+)\)/g;
    info2 = regex2.exec(data);
    if (info2) {
        error(data, info2[1], info2[2], info2[3], info2[4], info2[5]);
        return;
    }

    let regex1 = /(.+[Ee]rror): (.+): (.+)/g;
    info1 = regex1.exec(data);
    if (info1) {
        // Attempt find line number...
        let line = 0,
            char = 0;
        let regex3 = (/^>\s(\d+).+$\n\s{5}\|(.+)$/gum).exec(data);
        if (regex3) {
            line = regex3[1];
            char = regex3[2].length;
        }
        error(data, info1[1], info1[2], info1[3], line, char);
        return;
    }

    

    print(data);
}

function error(stackText='', eType, eFile, eDescription, eLine=0, eCharacter=0) {
    console.log('---START---');
    console.log('>>>>ERROR|||%s|||%s|||%s|||%i|||%i',
        eType, eFile, eDescription, eLine, eCharacter);
    console.log(stackText);
    console.log('---END---');
}

function print(text) {
    console.log('---START---');
    console.log(text);
    console.log('---END---');
}