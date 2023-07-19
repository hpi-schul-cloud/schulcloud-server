import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Pseudonym } from '@shared/domain';
import { BaseDORepo } from '@shared/repo';
import { ExternalToolPseudonymEntity, IExternalToolPseudonymEntityProps } from '../entity';

@Injectable()
export class ExternalToolPseudonymRepo extends BaseDORepo<
	Pseudonym,
	ExternalToolPseudonymEntity,
	IExternalToolPseudonymEntityProps
> {
	get entityName(): EntityName<ExternalToolPseudonymEntity> {
		return ExternalToolPseudonymEntity;
	}

	entityFactory(props: IExternalToolPseudonymEntityProps): ExternalToolPseudonymEntity {
		return new ExternalToolPseudonymEntity(props);
	}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: ExternalToolPseudonymEntity = await this._em.findOneOrFail(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDO(entity);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<Pseudonym | null> {
		const entity: ExternalToolPseudonymEntity | null = await this._em.findOne(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		if (!entity) {
			return null;
		}

		const domainObject: Pseudonym = this.mapEntityToDO(entity);

		return domainObject;
	}

	protected mapEntityToDO(entity: ExternalToolPseudonymEntity): Pseudonym {
		return new Pseudonym({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
		});
	}

	protected mapDOToEntityProperties(entityDO: Pseudonym): IExternalToolPseudonymEntityProps {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
