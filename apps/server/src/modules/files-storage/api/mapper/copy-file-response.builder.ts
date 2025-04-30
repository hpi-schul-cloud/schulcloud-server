import { CopyFileResponse } from '../dto/file-storage.response';

export class CopyFileResponseBuilder {
	public static build(id: string | undefined, sourceId: string, name: string): CopyFileResponse {
		const copyFileResponse = new CopyFileResponse({ id, sourceId, name });

		return copyFileResponse;
	}
}
