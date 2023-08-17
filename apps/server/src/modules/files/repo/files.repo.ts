import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, FileEntity } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityDictionary } from '@mikro-orm/core';
import { FileOwnerModel } from '../domain';

@Injectable()
export class FilesRepo extends BaseRepo<FileEntity> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName() {
		return FileEntity;
	}

	public async findFilesForCleanup(thresholdDate: Date, batchSize: number, offset: number): Promise<FileEntity[]> {
		const query = { deletedAt: { $lte: thresholdDate } };
		const options = { orderBy: { id: 'asc' }, limit: batchSize, offset, populate: ['storageProvider'] as never[] };
		const files = await this._em.find(FileEntity, query, options);

		return files;
	}

	public async findByOwnerUserId(ownerUserId: EntityId): Promise<FileEntity[]> {
		const ownerUserObjectId = new ObjectId(ownerUserId);

		const filter = { owner: ownerUserObjectId, refOwnerModel: FileOwnerModel.USER };

		const files = await this._em.find(FileEntity, filter);

		return files as FileEntity[];
	}

	public async findByPermissionRefId(permissionRefId: EntityId): Promise<FileEntity[]> {
		const permissionRefObjectId = new ObjectId(permissionRefId);

		const pipeline = [
			{
				$match: {
					permissions: {
						$elemMatch: {
							refId: permissionRefObjectId,
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
