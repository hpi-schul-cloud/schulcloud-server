import { Injectable } from '@nestjs/common';
import { TldrawDocumentApi } from './generated';

@Injectable()
export class TldrawClientAdapter {
	constructor(private readonly tldrawDocumentApi: TldrawDocumentApi) {}

	async deleteDrawingBinData(parentId: string): Promise<void> {
		await this.tldrawDocumentApi.deleteByDocName(parentId);
	}
}
