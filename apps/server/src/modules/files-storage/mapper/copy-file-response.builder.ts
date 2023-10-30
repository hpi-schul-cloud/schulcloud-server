import { CopyFileResponse } from '../controller/dto/file-storage.response';

export class CopyFileResponseBuilder {
	public static build(id: string, sourceId: string, name: string): CopyFileResponse {
		const copyFileResponse = new CopyFileResponse({ id, sourceId, name });

		return copyFileResponse;
	}
}
