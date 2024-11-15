import { AxiosResponse } from 'axios';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string): Promise<Buffer> {
		console.log('download file', fileRecordId, fileName);

		const response = (await this.api.download(fileRecordId, fileName, undefined, {
			responseType: 'blob',
		})) as AxiosResponse<Blob>;
		const file = await response.data.arrayBuffer();
		const buffer = Buffer.from(file);

		return buffer;
	}
}
