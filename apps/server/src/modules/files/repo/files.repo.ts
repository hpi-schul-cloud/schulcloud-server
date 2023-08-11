import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, File, FileRefOwnerModel, User } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';

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

	public async findByOwnerUserId(ownerUserId: EntityId): Promise<File[]> {
		const ownerUserObjectId = new ObjectId(ownerUserId);

		const filter = { owner: ownerUserObjectId, refOwnerModel: FileRefOwnerModel.USER };

		const files = await this._em.find(File, filter);

		return files as File[];
	}

	public async findByPermissionRefId(permissionRefId: EntityId): Promise<File[]> {
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

		const rawFilesDocuments = await this._em.aggregate(File, pipeline);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const files = rawFilesDocuments.map((rawFileDocument) => this._em.map(File, rawFileDocument));

		return files;
	}
}
