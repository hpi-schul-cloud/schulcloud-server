import { Injectable } from '@nestjs/common';
import { TldrawRepo } from '@src/modules/tldraw/repo/tldraw.repo';

@Injectable()
export class TldrawService {
	constructor(private readonly tldrawRepo: TldrawRepo) {}

	async deleteByDrawingName(drawingName: string): Promise<void> {
		const drawings = await this.tldrawRepo.findByDrawingName(drawingName);
		await this.tldrawRepo.delete(drawings);
	}
}
