import { GetFile } from '@shared/infra/s3-file-storage';
import { GetFileResponse } from '../interface';

export class FileResponseBuilder {
	public static build(file: GetFile, name: string): GetFileResponse {
		const fileResponse = { ...file, data: file.data, name };

		return fileResponse;
	}
}
