export interface IFile {
	fileName: string;
	buffer: Buffer | Blob;
	size: number;
	contentType: string;
}
