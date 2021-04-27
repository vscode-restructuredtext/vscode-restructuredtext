<<<<<<< HEAD
import { NodeStringDecoder, StringDecoder } from 'string_decoder';

export class LineDecoder {
	private stringDecoder: NodeStringDecoder;
=======
import { StringDecoder } from 'string_decoder';

export class LineDecoder {
	private stringDecoder: StringDecoder;
>>>>>>> upstream/master
	private remaining: string;
	private lines: string[]

	constructor(encoding: string = 'utf8') {
		this.stringDecoder = new StringDecoder(encoding);
		this.remaining = null;
		this.lines = [];
	}

	public write(buffer: Buffer): string[] {
		var result: string[] = [];
		var value = this.remaining
			? this.remaining + this.stringDecoder.write(buffer)
			: this.stringDecoder.write(buffer);

		if (value.length < 1) {
			this.lines = this.lines.concat(value)
			return result;
		}
		var start = 0;
		var ch: number;
		while (start < value.length && ((ch = value.charCodeAt(start)) === 13 || ch === 10)) {
			start++;
		}
		var idx = start;
		while (idx < value.length) {
			ch = value.charCodeAt(idx);
			if (ch === 13 || ch === 10) {
				result.push(value.substring(start, idx));
				idx++;
				while (idx < value.length && ((ch = value.charCodeAt(idx)) === 13 || ch === 10)) {
					idx++;
				}
				start = idx;
			} else {
				idx++;
			}
		}
		this.remaining = start < value.length ? value.substr(start) : null;
		this.lines = this.lines.concat(result)
		return result;
	}

	public end(): string {
		if (this.remaining && this.remaining.length > 0) {
			this.lines = this.lines.concat(this.remaining);
		}
		return this.remaining;
	}
	
	public getLines(): string[] {
		return this.lines;
	}
}