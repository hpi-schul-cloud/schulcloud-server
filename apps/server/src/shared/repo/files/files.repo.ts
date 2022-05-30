import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { BaseRepo } from '../base.repo';

@Injectable()
export class FilesRepo extends BaseRepo<File> {
	constructor(private fileStorageAdapter: FileStorageAdapter, protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return File;
	}

	propertiesToPopulate = ['storageProvider'];

	async findAllFilesForCleanup(cleanupThreshold: Date): Promise<File[]> {
		const filesForCleanupQuery = { deletedAt: { $lte: cleanupThreshold } };
		const files = await this._em.find(File, filesForCleanupQuery);
		const regularFiles = files.filter((file) => file.isDirectory === false);
		await this._em.populate(regularFiles, this.propertiesToPopulate as never[]);
		return files;
	}

	async deleteFile(file: File): Promise<void> {
		if (file.isDirectory === false) await this.fileStorageAdapter.deleteFile(file);
		await this.delete(file);
	}
}
