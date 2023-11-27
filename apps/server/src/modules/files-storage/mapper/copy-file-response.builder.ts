import { CopyFileResponse } from '../controller/dto';

export class CopyFileResponseBuilder {
	public static build(id: string, sourceId: string, name: string): CopyFileResponse {
		const copyFileResponse = new CopyFileResponse({ id, sourceId, name });

		return copyFileResponse;
	}
}
