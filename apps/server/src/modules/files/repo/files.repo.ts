import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityDictionary } from '@mikro-orm/core';
import { FileOwnerModel } from '../domain';
import { FileEntity } from '../entity';

@Injectable()
export class FilesRepo extends BaseRepo<FileEntity> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return FileEntity;
	}

	public async findForCleanup(thresholdDate: Date, batchSize: number, offset: number): Promise<FileEntity[]> {
		const filter = { deletedAt: { $lte: thresholdDate } };
		const options = {
			orderBy: { id: 'asc' },
			limit: batchSize,
			offset,
			populate: ['storageProvider'] as never[],
		};

		const files = await this._em.find(FileEntity, filter, options);

		return files as FileEntity[];
	}

	public async findByOwnerUserId(ownerUserId: EntityId): Promise<FileEntity[]> {
		const filter = {
			owner: new ObjectId(ownerUserId),
			refOwnerModel: FileOwnerModel.USER,
		};

		const files = await this._em.find(FileEntity, filter);

		return files as FileEntity[];
	}

	public async findByPermissionRefId(permissionRefId: EntityId): Promise<FileEntity[]> {
		const pipeline = [
			{
				$match: {
					permissions: {
						$elemMatch: {
							refId: new ObjectId(permissionRefId),
						},
					},
				},
			},
		];

		const rawFilesDocuments = await this._em.aggregate(FileEntity, pipeline);

		const files = rawFilesDocuments.map((rawFileDocument) =>
			this._em.map(FileEntity, rawFileDocument as EntityDictionary<FileEntity>)
		);

		return files;
	}
}
