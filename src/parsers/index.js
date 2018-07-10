import path from 'path';
import fs from 'fs';

// const PARSERS_DIR = path.join(__dirname, 'parsers');

export const getAvailableParsers = () => {
    let availableParsers = {};
    for(let parserModule of parserModulesIterator())
        availableParsers = {...availableParsers, ...parserModule};
    return availableParsers;
}


function* parserModulesIterator() {
    for (let file of fs.readdirSync(__dirname)) {
        if (file.match(/Parser\.js$/))
            yield require(path.join(__dirname, file)) // './' + file);
    }
}