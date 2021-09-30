import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseFile, File } from '../entity';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	propertiesToPopulate = ['storageProvider'];

	async getExpiredFiles(backupPeriodThreshold: Date): Promise<BaseFile[]> {
		const files = await this.em.find(BaseFile, { deletedAt: { $lt: backupPeriodThreshold } });
		const regularFiles: File[] = files.filter((file) => !file.isDirectory) as File[];
		await this.em.populate(regularFiles, this.propertiesToPopulate);
		return files;
	}

	deleteFile(file: BaseFile): Promise<void> {
		return this.em.removeAndFlush(file);
	}
}
