import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	SchoolMaterialTransferRequestEntity,
	SchoolMaterialTransferType,
} from './entity/school-material-transfer-request.entity';

@Injectable()
export class SchoolMaterialTransferRequestRepo {
	constructor(private readonly em: EntityManager) {}

	public async create(entity: SchoolMaterialTransferRequestEntity): Promise<SchoolMaterialTransferRequestEntity> {
		this.em.persist(entity);
		await this.em.flush();
		return entity;
	}

	public async findById(id: EntityId): Promise<SchoolMaterialTransferRequestEntity | null> {
		return await this.em.findOne(SchoolMaterialTransferRequestEntity, { id });
	}

	public async findByRequester(requesterUserId: EntityId): Promise<SchoolMaterialTransferRequestEntity[]> {
		return await this.em.find(SchoolMaterialTransferRequestEntity, { requesterUserId });
	}

	public async findExisting(
		requesterUserId: EntityId,
		type: SchoolMaterialTransferType,
		refId: EntityId
	): Promise<SchoolMaterialTransferRequestEntity | null> {
		return await this.em.findOne(SchoolMaterialTransferRequestEntity, {
			requesterUserId,
			type,
			refId,
		});
	}

	public async save(entity: SchoolMaterialTransferRequestEntity): Promise<void> {
		this.em.persist(entity);
		await this.em.flush();
	}
}
