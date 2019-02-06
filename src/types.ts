import { Position, Extension } from "vscode";


export const NEWLINE_REGEX = /\r\n|\r|\n/;


export interface ISimpleChangeEvent {
    offset: number;
    removedLength: number;
    addedLength: number;
    
    applicable: boolean;
    newLinesCount: number;

    originalPosition: Position;
    newPosition: Position;
    removeNativeIndents: number;
}

export interface IParserResult {
    event: ISimpleChangeEvent;
    result: any;
}

export interface IGrammarExtension {
    extPath: string;
    language: string;
    scopeName: string;
    extension: Extension<any>;
}
