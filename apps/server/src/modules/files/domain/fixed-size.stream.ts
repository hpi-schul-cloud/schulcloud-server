import { Transform, type TransformCallback } from 'node:stream';

const PADDING_CHUNK_SIZE = 64 * 1024;

/**
 * Passes through exactly `expectedSize` bytes: surplus input is dropped, missing input is zero-padded.
 * This keeps a streamed archive consistent with an announced Content-Length even if a source fails.
 */
export class FixedSizeStream extends Transform {
	private writtenBytes = 0;

	private paddedBytes = 0;

	private droppedBytes = 0;

	private flushCallback?: TransformCallback;

	constructor(private readonly expectedSize: number) {
		super();
	}

	get isExact(): boolean {
		return this.paddedBytes === 0 && this.droppedBytes === 0;
	}

	public _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
		const remaining = this.expectedSize - this.writtenBytes;

		if (remaining <= 0) {
			this.droppedBytes += chunk.length;
			callback();

			return;
		}

		const accepted = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
		this.droppedBytes += chunk.length - accepted.length;
		this.writtenBytes += accepted.length;
		callback(null, accepted);
	}

	public _flush(callback: TransformCallback): void {
		this.flushCallback = callback;
		this.pushPadding();
	}

	public _read(size: number): void {
		super._read(size);

		if (this.flushCallback) {
			this.pushPadding();
		}
	}

	private pushPadding(): void {
		while (this.writtenBytes < this.expectedSize) {
			const chunkSize = Math.min(PADDING_CHUNK_SIZE, this.expectedSize - this.writtenBytes);
			this.writtenBytes += chunkSize;
			this.paddedBytes += chunkSize;

			// Padding continues in _read once the consumer drains the buffer.
			if (!this.push(Buffer.alloc(chunkSize))) {
				return;
			}
		}

		const callback = this.flushCallback;
		this.flushCallback = undefined;
		callback?.();
	}
}
