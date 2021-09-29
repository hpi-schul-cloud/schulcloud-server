import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { File } from '../entity';

@Injectable()
export class FilesRepo extends BaseRepo<File> {
	propertiesToPopulate = ['storageProvider'];

	async getExpiredFiles(backupPeriodThreshold: Date): Promise<File[]> {
		const files = await this.em.find(File, { deletedAt: { $lt: backupPeriodThreshold } });
		await this.em.populate(files, this.propertiesToPopulate);
		return files;
	}

	deleteFile(file: File): Promise<void> {
		return this.em.removeAndFlush(file);
	}
}
