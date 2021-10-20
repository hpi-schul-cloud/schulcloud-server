import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { BaseRepo } from '@shared/repo/base.repo';
import { BaseFile, File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	constructor(private fileStorageAdapter: FileStorageAdapter, protected readonly em: EntityManager) {
		super(em);
	}

	propertiesToPopulate = ['storageProvider'];

	async findAllFilesForCleanup(cleanupThreshold: Date): Promise<BaseFile[]> {
		const filesForCleanupQuery = { deletedAt: { $lte: cleanupThreshold } };
		const files = await this.em.find(BaseFile, filesForCleanupQuery);
		const regularFiles = files.filter((file) => file instanceof File);
		await this.em.populate(regularFiles, this.propertiesToPopulate);
		return files;
	}

	async deleteFile(file: BaseFile): Promise<void> {
		if (file instanceof File) await this.fileStorageAdapter.deleteFile(file);
		await this.removeAndFlush(file);
	}
}
