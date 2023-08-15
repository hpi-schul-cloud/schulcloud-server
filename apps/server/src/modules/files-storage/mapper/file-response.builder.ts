import { IGetFile, IGetFileResponse } from '../interface';

export class FileResponseBuilder {
	public static build(file: IGetFile, name: string): IGetFileResponse {
		const fileResponse = { ...file, data: file.data, name };

		return fileResponse;
	}
}
