export class LineFragment {
    text = '';
    lineIndex = 0;
    startIndex = 0;
    endIndex = 0;
    scopes = [];

    constructor(text, lineIndex, startIndex, endIndex, scopes) {
        this.text = text;
        this.lineIndex = lineIndex;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.scopes = scopes;
    }

    hasScope(value) {
        if (value instanceof RegExp) {
            for(let i=0; i<this.scopes.length; ++i){
                if (this.scopes[i].match(value))
                    return true;
            }
            return false;
        } else {
            return this.scopes.indexOf(value) !== -1;
        }
    }

    isScope(value) {
        if (value instanceof RegExp) {
            return !!this.scopes[this.scopes.length-1].match(value);
        } else {
            return this.scopes[this.scopes.length-1] === value;
        }
    }
}