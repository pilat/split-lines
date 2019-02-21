import { join } from 'path';
import { SplitLines } from './splitLines';
import { SplitLinesProvider } from './provider';
import { ExtensionContext } from 'vscode';
import { TelemetryReporter } from './telemetry';


export let reporter:TelemetryReporter;

export function activate(context: ExtensionContext) {
    const packageInfo = require(join(context.extensionPath, 'package.json'));
    reporter = new TelemetryReporter(packageInfo.name, packageInfo.version);

    const provider = new SplitLinesProvider();
    context.subscriptions.push(new SplitLines(provider));
    context.subscriptions.push(reporter);

    const api = {
        getProvider() {
            return provider
        }
    }

    // 'export' public api-surface. For test purpose basically
    return api
}

// export function deactivate() {
//     if (reporter) {
//         // This will ensure all pending events get flushed
//         reporter.dispose();
//     }
// }
