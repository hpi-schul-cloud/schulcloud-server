import { PseudonymDO } from '@shared/domain/domainobject/pseudonym.do';
import { EntityName } from '@mikro-orm/core';
import { EntityId, IPseudonymProperties, Pseudonym } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseDORepo, EntityProperties } from '../base.do.repo';

@Injectable()
export class PseudonymsRepo extends BaseDORepo<PseudonymDO, Pseudonym, IPseudonymProperties> {
	get entityName(): EntityName<Pseudonym> {
		return Pseudonym;
	}

	entityFactory(props: IPseudonymProperties): Pseudonym {
		return new Pseudonym(props);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<PseudonymDO> {
		const entity = await this._em.findOneOrFail(Pseudonym, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDO(entity);
	}

	protected mapEntityToDO(entity: Pseudonym): PseudonymDO {
		return new PseudonymDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
		});
	}

	protected mapDOToEntityProperties(entityDO: PseudonymDO): EntityProperties<IPseudonymProperties> {
		return {
			id: entityDO.id,
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
