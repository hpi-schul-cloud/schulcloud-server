export interface LegacyFileResponse {
	_id: string;
	name: string;
	isDirectory: boolean;
	parent?: string;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: string;
}
