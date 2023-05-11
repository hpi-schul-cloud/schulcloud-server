import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { File } from '@shared/domain';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FindCursor } from 'mongodb';
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

	public async findAndCountFilesForCleanup(
		removedSince: Date,
		batchSize: number,
		batchCounter: number
	): Promise<[File[], number]> {
		const query = { deletedAt: { $lte: removedSince } };
		const options = { limit: batchSize, offset: batchCounter * batchSize, populate: ['storageProvider'] as never[] };
		const files = await this._em.find(File, query, options);

		return [files, files.length];
	}

	// getCursor(cleanupThreshold: Date): FindCursor {
	// 	const filesForCleanupQuery = { deletedAt: { $lte: cleanupThreshold } };
	// 	const cursor = this._em.getCollection(File).find(filesForCleanupQuery);

	// 	return cursor;
	// }

	async deleteFile(file: File): Promise<void> {
		await this.delete(file);
	}
}
