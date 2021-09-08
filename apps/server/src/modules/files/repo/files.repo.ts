import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { File } from '../entity';

@Injectable()
export class FilesRepo extends BaseRepo<File> {
	getExpiredFiles(backupPeriodThreshold: Date): Promise<File[]> {
		return this.em.find(File, { deletedAt: { $lt: backupPeriodThreshold } });
	}
}
