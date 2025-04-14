import { CopyFileResponse } from '../api/dto/file-storage.response';

export class CopyFileResponseBuilder {
	public static build(id: string, sourceId: string, name: string): CopyFileResponse {
		const copyFileResponse = new CopyFileResponse({ id, sourceId, name });

		return copyFileResponse;
	}

	public static buildError(sourceId: string, name: string): CopyFileResponse {
		const copyFileResponse = new CopyFileResponse({ id: undefined, sourceId, name });

		return copyFileResponse;
	}
}
