import { Injectable } from '@nestjs/common';
import { TldrawRepo } from '../repo';

@Injectable()
export class TldrawService {
	constructor(private readonly tldrawRepo: TldrawRepo) {}

	async deleteByDocName(docName: string): Promise<void> {
		const drawings = await this.tldrawRepo.findByDocName(docName);
		await this.tldrawRepo.delete(drawings);
	}
}
