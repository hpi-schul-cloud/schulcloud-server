import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IPseudonymProperties, Pseudonym } from '@shared/domain';
import { PseudonymDO } from '@shared/domain/domainobject/pseudonym.do';
import { BaseDORepo } from '../base.do.repo';

@Injectable()
export class PseudonymsRepo extends BaseDORepo<PseudonymDO, Pseudonym, IPseudonymProperties> {
	get entityName(): EntityName<Pseudonym> {
		return Pseudonym;
	}

	entityFactory(props: IPseudonymProperties): Pseudonym {
		return new Pseudonym(props);
	}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const entity: Pseudonym = await this._em.findOneOrFail(Pseudonym, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDO(entity);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<PseudonymDO | null> {
		const entity: Pseudonym | null = await this._em.findOne(Pseudonym, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		if (!entity) {
			return null;
		}

		const domainObject: PseudonymDO = this.mapEntityToDO(entity);

		return domainObject;
	}

	protected mapEntityToDO(entity: Pseudonym): PseudonymDO {
		return new PseudonymDO({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
		});
	}

	protected mapDOToEntityProperties(entityDO: PseudonymDO): IPseudonymProperties {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
