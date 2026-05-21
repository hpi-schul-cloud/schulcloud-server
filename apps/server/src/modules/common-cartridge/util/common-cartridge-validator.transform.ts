import { Transform, TransformCallback, TransformOptions } from 'stream';

export class CommonCartridgeValidatorTransform extends Transform {
	private ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

	private magicNumberValidated = false;
	private chunks: Buffer[] = [];
	private bytesRead = 0;

	constructor(
		private readonly maximumSize: number,
		options?: TransformOptions
	) {
		super(options);
	}

	public _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
		this.bytesRead += chunk.length;
		if (this.bytesRead > this.maximumSize) {
			this.emit('validated', false);
			return callback();
		}

		this.push(chunk);

		if (this.magicNumberValidated) {
			return callback();
		}

		this.chunks.push(chunk);

		if (this.bytesRead >= this.ZIP_MAGIC.length) {
			this.magicNumberValidated = true;

			const fullBuffer = Buffer.concat(this.chunks, this.bytesRead);
			const fileHeader = fullBuffer.subarray(0, this.ZIP_MAGIC.length);

			const isValid = fileHeader.equals(this.ZIP_MAGIC);
			this.emit('validated', isValid);

			this.chunks.length = 0;
		}

		callback();
	}

	public _flush(callback: TransformCallback): void {
		if (!this.magicNumberValidated) {
			this.emit('validated', false);
			this.chunks.length = 0;
		}

		callback();
	}
}
