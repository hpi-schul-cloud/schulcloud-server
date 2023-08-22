// Types are manually added from stream-mime-type package because directive of module resolution leads to ts error.
// In case of dependency update please update these types here.
export interface GetMimeTypeOptionsStrict {
	strict: true;
	filename?: string;
}
export interface GetMimeTypeOptionsNoStrict {
	strict?: false;
	filename?: string;
}
export type GetMimeTypeOptions = GetMimeTypeOptionsStrict | GetMimeTypeOptionsNoStrict;
export interface GetMimeTypeResultStrict {
	mime: string | undefined;
	stream: undefined;
}
export interface GetMimeTypeResult {
	mime: string;
	stream: undefined;
}
export interface GetMimeTypeResultStrictWithStream {
	mime: string | undefined;
	stream: NodeJS.ReadableStream;
}
export interface GetMimeTypeResultWithStream {
	mime: string;
	stream: NodeJS.ReadableStream;
}
export declare function getMimeType(
	data: NodeJS.ReadableStream,
	options: GetMimeTypeOptionsStrict
): Promise<GetMimeTypeResultStrictWithStream>;
export declare function getMimeType(
	data: NodeJS.ReadableStream,
	options?: GetMimeTypeOptionsNoStrict
): Promise<GetMimeTypeResultWithStream>;
export declare function getMimeType(
	data: number | Uint8Array,
	options: GetMimeTypeOptionsStrict
): Promise<GetMimeTypeResultStrict>;
export declare function getMimeType(
	data: number | Uint8Array,
	options?: GetMimeTypeOptionsNoStrict
): Promise<GetMimeTypeResult>;
