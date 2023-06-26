import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { File } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class FilesRepo extends BaseRepo<File> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return File;
	}

	public async findFilesForCleanup(thresholdDate: Date, batchSize: number, offset: number): Promise<File[]> {
		const query = { deletedAt: { $lte: thresholdDate } };
		const options = { orderBy: { id: 'asc' }, limit: batchSize, offset, populate: ['storageProvider'] as never[] };
		const files = await this._em.find(File, query, options);

		return files;
	}
}
