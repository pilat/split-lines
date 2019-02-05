import { ISimpleChangeEvent, NEWLINE_REGEX, IParserResult } from './types';
import { LanguageParser } from './parser';
import { TextDocument, window, TextDocumentChangeEvent, TextDocumentContentChangeEvent, Selection } from "vscode";


export class SplitLinesProvider {
    private parsers:Map<string, LanguageParser> = new Map();
    public editPromise:Thenable<boolean> = Promise.resolve(true); // For tests purpose

    private restoreOriginalText(newText:string, events:ISimpleChangeEvent[]): string {
        let text:string = newText;
        // Convert current text to text before changes
        
        for (let cur of events) {
            let fragLeft = text.substr(0, cur.offset);
            let fragRight = text.substr(cur.offset + cur.addedLength);
            let fragGone = '?'.repeat(cur.removedLength);
            text = fragLeft + fragGone + fragRight;
        }
        return text;
    }

    private convertToSimpleChanges(events:TextDocumentContentChangeEvent[]): ISimpleChangeEvent[] {
        // Copy as simple events
        let simpleEvents:ISimpleChangeEvent[] = events.map(
            (e:TextDocumentContentChangeEvent) => {
                const lines = e.text.split(NEWLINE_REGEX);
                const newLinesCount = lines.length - 1;  // maybe it is a bad solution
                const newPosition = e.range.start.translate(newLinesCount, -e.range.start.character);
                const removeNativeIndents = lines[lines.length-1].length

                return {
                    offset: e.rangeOffset,
                    addedLength: e.text.length,
                    removedLength: e.rangeLength,

                    applicable: e.text.startsWith('\n') || e.text.startsWith('\r\n'),
                    newLinesCount,

                    originalPosition: e.range.start,
                    newPosition,
                    removeNativeIndents
                }
            });

        // Sort from top document to bottom
        simpleEvents.sort((a, b) => {
            if (a.offset > b.offset) {
                return 1;
            } else if (a.offset == b.offset) {
                return 0;
            } else {
                return -1;
            }
        });
        return simpleEvents;
    }

    public openDocument(doc: TextDocument) {
        if (!this.parsers.has(doc.languageId)){
            this.parsers.set(doc.languageId, new LanguageParser(doc.languageId));
        }
    }

    public changeDocument(event:TextDocumentChangeEvent) {
        const doc:TextDocument = event.document;
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const parser:LanguageParser | undefined = this.parsers.get(doc.languageId);
        if (event.contentChanges.length === 0 || !parser || !parser.isReady) {
            return;
        }

        const events = this.convertToSimpleChanges(event.contentChanges);
        const applicableEvents = events.filter((e:ISimpleChangeEvent) => e.applicable);
        if (applicableEvents.length === 0) {
            return;
        }

        try {
            // Restore text before changes
            let fullText:string = doc.getText();
            let oldText = this.restoreOriginalText(fullText, events);

            // Get simple instructions ordered from top to bottom
            let changes:IParserResult[] = applicableEvents.map(e => 
                parser.getChange(oldText, e)).filter(e => e.result);
            
            if (changes.length === 0) {
                // When parser decided do nothing
                return;
            }

            let linesAbove: number = 0;
            this.editPromise = editor.edit(editBuilder => {
                let change:IParserResult;

                for (change of changes) {
                    // Fix lines coordinates
                    change.event.originalPosition = change.event.originalPosition.translate(linesAbove);
                    change.event.newPosition = change.event.newPosition.translate(linesAbove);

                    // Remove native indent (sometimes vscode add default indednt himself. Remove this indent)
                    const delMe = new Selection(change.event.newPosition.line, 0,
                        change.event.newPosition.line, change.event.removeNativeIndents);
                    editBuilder.delete(delMe);

                    // Apply changes and add lines when it necessary (when parser was adding newlines)
                    linesAbove += parser.applyChange(editBuilder, change);

                    // Increase lines above because newline has already added
                    linesAbove += change.event.newLinesCount;
                }
            });
        }catch(e) {
            // noop
        }
    }
}
