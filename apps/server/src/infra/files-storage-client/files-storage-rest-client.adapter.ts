import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string): Promise<string> {
		const response = await this.api.download(fileRecordId, fileName, undefined, { responseType: 'blob' });
		const data = response.data.toString();

		console.error(response);

		return data;
	}
}
