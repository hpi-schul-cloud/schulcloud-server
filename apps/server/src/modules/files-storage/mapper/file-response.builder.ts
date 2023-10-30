import { GetFile } from '@shared/infra/s3-client/interfaces';
import { GetFileResponse } from '../interface/interfaces';

export class FileResponseBuilder {
	public static build(file: GetFile, name: string): GetFileResponse {
		const fileResponse = { ...file, data: file.data, name };

		return fileResponse;
	}
}
