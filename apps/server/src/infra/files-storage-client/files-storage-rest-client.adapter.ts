import { AxiosResponse } from 'axios';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string): Promise<Buffer> {
		const response = (await this.api.download(fileRecordId, fileName, undefined, {
			responseType: 'blob',
		})) as AxiosResponse<Blob>;
		const file = await response.data.arrayBuffer();
		const buffer = Buffer.from(file);

		return buffer;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async upload(): Promise<void> {
		// const config = this.getAxiosRequestConfig();
		// const blob = new Blob([file]);
		// const formData = new FormData();
		// formData.append('file', blob, 'file');

		// await this.api.upload(fileRecordId, formData, config);

		throw new Error('Method not implemented.');
	}
}
