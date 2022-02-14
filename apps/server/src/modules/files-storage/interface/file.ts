export interface IFile {
	name: string;
	buffer: Buffer | Blob | ReadableStream;
	size: number;
	type: string;
}
