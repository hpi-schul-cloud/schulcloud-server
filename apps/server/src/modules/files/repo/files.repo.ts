import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseFile, File, Directory } from '@shared/domain';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	propertiesToPopulate = ['storageProvider'];

	async getExpiredFiles(backupPeriodThreshold: Date): Promise<BaseFile[]> {
		const expiredFilesQuery = { deletedAt: { $lt: backupPeriodThreshold } };
		const regularFiles = await this.em.find(File, expiredFilesQuery);
		await this.em.populate(regularFiles, this.propertiesToPopulate);
		const directories = await this.em.find(Directory, expiredFilesQuery);
		return [...regularFiles, ...directories];
	}

	deleteFile(file: BaseFile): Promise<void> {
		return this.em.removeAndFlush(file);
	}
}
