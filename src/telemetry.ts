import { default as _TelemetryReporter } from 'vscode-extension-telemetry';


const TELEMETRY_KEY = '76f58b4d-32eb-4f10-90f9-b77011aa9c94';


export class TelemetryReporter extends _TelemetryReporter {
    constructor(name: string, version: string) {
        super(name, version , TELEMETRY_KEY);
    }
}
