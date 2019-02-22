import { workspace, Disposable } from 'vscode';
import { SplitLinesProvider } from './provider';

export class SplitLines implements Disposable {
    private disposables: Disposable[] = [];

    constructor(private provider: SplitLinesProvider) {
        const p = this.provider;

        workspace.onDidOpenTextDocument(p.openDocument, p, this.disposables);
        workspace.onDidChangeTextDocument(p.changeDocument, p, this.disposables);

        for (const doc of workspace.textDocuments) {
            p.openDocument(doc);
        }
    }

    public dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
    }
}
