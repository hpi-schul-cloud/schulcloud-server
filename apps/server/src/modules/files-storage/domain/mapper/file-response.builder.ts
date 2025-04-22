import { GetFile } from '@infra/s3-client';
import { GetFileResponse } from '../interface';

export class FileResponseBuilder {
	public static build(file: GetFile, name: string): GetFileResponse {
		const fileResponse = { ...file, data: file.data, name };

		return fileResponse;
	}
}
