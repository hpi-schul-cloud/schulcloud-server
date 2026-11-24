import { Stream } from 'node:stream';

const isObjectId = (value: object): value is { toHexString(): string } =>
	(value as { _bsontype?: unknown })._bsontype === 'ObjectId' &&
	typeof (value as { toHexString?: unknown }).toHexString === 'function';

const isWebStream = (value: object): boolean =>
	typeof ReadableStream !== 'undefined' && value instanceof ReadableStream;

/**
 * Values whose own properties say nothing useful in a log, or point to things that must not be logged.
 * Returns the text to log instead, or undefined when the value is logged property by property as usual.
 */
export const summarizeOpaqueLogValue = (value: object): string | undefined => {
	// The only own property of an ObjectId is its binary buffer, so the id itself would be lost.
	if (isObjectId(value)) {
		return value.toHexString();
	}

	// A stream (e.g. an axios body with responseType 'stream') references the socket and the raw request with its headers.
	if (value instanceof Stream || isWebStream(value)) {
		return '[Stream]';
	}

	if (value instanceof Blob) {
		return `[Blob ${value.size} bytes]`;
	}

	if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer || ArrayBuffer.isView(value)) {
		return `[Binary ${value.byteLength} bytes]`;
	}

	return undefined;
};
