export class LineFragment {
    constructor(public text: string,
                public lineIndex: number,
                public startIndex: number,
                public endIndex: number,
                public scopes: string[]) { }

    public hasScope(value: RegExp | string): boolean {
        if (value instanceof RegExp) {
            for (const scope of this.scopes) {
                if (scope.match(value)) {
                    return true;
                }
            }
            return false;
        } else {
            return this.scopes.indexOf(value) !== -1;
        }
    }

    public isScope(value: RegExp | string): boolean {
        if (value instanceof RegExp) {
            return !!this.scopes[this.scopes.length - 1].match(value);
        } else {
            return this.scopes[this.scopes.length - 1] === value;
        }
    }
}
