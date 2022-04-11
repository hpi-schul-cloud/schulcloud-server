import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import { BaseFile, File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { BaseRepo } from '../base.repo';

@Injectable()
export class FilesRepo extends BaseRepo<BaseFile> {
	constructor(private fileStorageAdapter: FileStorageAdapter, protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return BaseFile;
	}

	propertiesToPopulate = ['storageProvider'];

	async findAllFilesForCleanup(cleanupThreshold: Date): Promise<BaseFile[]> {
		const filesForCleanupQuery = { deletedAt: { $lte: cleanupThreshold } };
		const files = await this._em.find(BaseFile, filesForCleanupQuery);
		const regularFiles = files.filter((file) => file instanceof File);
		await this._em.populate(regularFiles, this.propertiesToPopulate as never[]);
		return files;
	}

	async deleteFile(file: BaseFile): Promise<void> {
		if (file instanceof File) await this.fileStorageAdapter.deleteFile(file);
		await this.delete(file);
	}
}
