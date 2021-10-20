import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseFile, File } from '@shared/domain';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	propertiesToPopulate = ['storageProvider'];

	async findAllFilesForCleanup(cleanupThreshold: Date): Promise<BaseFile[]> {
		const filesForCleanupQuery = { deletedAt: { $lte: cleanupThreshold } };
		const files = await this.em.find(BaseFile, filesForCleanupQuery);
		const regularFiles = files.filter((file) => file instanceof File);
		await this.em.populate(regularFiles, this.propertiesToPopulate);
		return files;
	}
}
