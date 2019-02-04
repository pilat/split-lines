import { SplitLines } from './split-lines';
import { SplitLinesProvider } from './provider';
import { ExtensionContext } from 'vscode';


export function activate(context: ExtensionContext) {
    const provider = new SplitLinesProvider();
    context.subscriptions.push(new SplitLines(provider));

    const api = {
        getProvider() {
            return provider
        }
    }

    // 'export' public api-surface. For test purpose basically
    return api
}
