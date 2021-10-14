import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseFile, File, Directory } from '@shared/domain';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	propertiesToPopulate = ['storageProvider'];

	async getExpiredFiles(backupPeriodThreshold: Date): Promise<BaseFile[]> {
		const expiredFilesQuery = { deletedAt: { $lt: backupPeriodThreshold } };
		const files = await this.em.find(BaseFile, expiredFilesQuery);
		const regularFiles = files.filter((file) => file instanceof File);
		await this.em.populate(regularFiles, this.propertiesToPopulate);
		return files;
	}
}
