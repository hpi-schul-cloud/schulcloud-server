import { Transform, TransformCallback, TransformOptions } from 'node:stream';

export const CC_VALIDATION_ERROR_EVENT = 'validationError';
export enum CcValidationErrorType {
	'MaximumSizeExceeded' = 'MaximumSizeExceeded',
	'NotAZipFile' = 'NotAZipFile',
}

export class CommonCartridgeValidatorTransform extends Transform {
	private readonly ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

	private magicNumberValidated = false;
	private readonly chunks: Buffer[] = [];
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
			this.emit(CC_VALIDATION_ERROR_EVENT, CcValidationErrorType.MaximumSizeExceeded);

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

			const notValid = !fileHeader.equals(this.ZIP_MAGIC);
			if (notValid) {
				this.emit(CC_VALIDATION_ERROR_EVENT, CcValidationErrorType.NotAZipFile);
			}

			this.chunks.length = 0;
		}

		callback();
	}

	public _flush(callback: TransformCallback): void {
		if (!this.magicNumberValidated) {
			this.emit(CC_VALIDATION_ERROR_EVENT, CcValidationErrorType.NotAZipFile);

			this.chunks.length = 0;
		}

		callback();
	}
}
