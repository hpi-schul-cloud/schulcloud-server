import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { BaseDORepo } from '@shared/repo/base.do.repo';
import { EntityId, Pseudonym } from '@shared/domain';
import { IPseudonymEntityProps, PseudonymEntity } from '../entity';

@Injectable()
export class PseudonymsRepo extends BaseDORepo<Pseudonym, PseudonymEntity, IPseudonymEntityProps> {
	get entityName(): EntityName<PseudonymEntity> {
		return PseudonymEntity;
	}

	entityFactory(props: IPseudonymEntityProps): PseudonymEntity {
		return new PseudonymEntity(props);
	}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: PseudonymEntity = await this._em.findOneOrFail(PseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDO(entity);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<Pseudonym | null> {
		const entity: PseudonymEntity | null = await this._em.findOne(PseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		if (!entity) {
			return null;
		}

		const domainObject: Pseudonym = this.mapEntityToDO(entity);

		return domainObject;
	}

	protected mapEntityToDO(entity: PseudonymEntity): Pseudonym {
		return new Pseudonym({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
		});
	}

	protected mapDOToEntityProperties(entityDO: Pseudonym): IPseudonymEntityProps {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
