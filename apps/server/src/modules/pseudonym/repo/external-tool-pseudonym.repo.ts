import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Pseudonym } from '@shared/domain';
import { ExternalToolPseudonymEntity, IExternalToolPseudonymEntityProps } from '../entity';

@Injectable()
export class ExternalToolPseudonymRepo {
	constructor(private readonly em: EntityManager) {}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: ExternalToolPseudonymEntity = await this.em.findOneOrFail(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDomainObject(entity);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<Pseudonym | null> {
		const entity: ExternalToolPseudonymEntity | null = await this.em.findOne(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		if (!entity) {
			return null;
		}

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	async createOrUpdate(domainObject: Pseudonym): Promise<Pseudonym> {
		const existing: ExternalToolPseudonymEntity | undefined = this.em
			.getUnitOfWork()
			.getById<ExternalToolPseudonymEntity>(ExternalToolPseudonymEntity.name, domainObject.id);

		const entityProps: IExternalToolPseudonymEntityProps = this.mapDomainObjectToEntityProperties(domainObject);
		let entity: ExternalToolPseudonymEntity = new ExternalToolPseudonymEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}

		await this.em.flush();

		const savedDomainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	protected mapEntityToDomainObject(entity: ExternalToolPseudonymEntity): Pseudonym {
		return new Pseudonym({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	protected mapDomainObjectToEntityProperties(entityDO: Pseudonym): IExternalToolPseudonymEntityProps {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
