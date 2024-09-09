import { Injectable } from '@nestjs/common';
import { SyncService } from '../service/sync.service';

@Injectable()
export class SyncUc {
	constructor(private readonly syncService: SyncService) {}

	public async startSync(target: string): Promise<void> {
		await this.syncService.startSync(target);
	}
}
