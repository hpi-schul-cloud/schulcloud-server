import { EntityName } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { OwnerType } from '../domain';
import { FileEntity } from '../entity';

@Injectable()
export class FilesRepo extends BaseRepo<FileEntity> {
	constructor(protected readonly _em: EntityManager) {
		super(_em);
	}

	get entityName(): EntityName<FileEntity> {
		return FileEntity;
	}

	public async findByIdAndOwnerType(ownerId: EntityId, ownerType: OwnerType): Promise<FileEntity[]> {
		const filter = {
			owner: new ObjectId(ownerId),
			refOwnerModel: ownerType,
		};

		const files = await this._em.find(FileEntity, filter);

		return files as FileEntity[];
	}
}
