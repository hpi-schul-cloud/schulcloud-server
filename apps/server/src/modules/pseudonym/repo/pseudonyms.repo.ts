import { Injectable } from '@nestjs/common';
import { EntityId, Pseudonym } from '@shared/domain';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { IPseudonymEntityProps, PseudonymEntity } from '../entity';

@Injectable()
export class PseudonymsRepo {
	constructor(private readonly em: EntityManager) {}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: PseudonymEntity = await this.em.findOneOrFail(PseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		return this.mapEntityToDomainObject(entity);
	}

	async findByUserIdAndToolId(userId: EntityId, toolId: EntityId): Promise<Pseudonym | null> {
		const entity: PseudonymEntity | null = await this.em.findOne(PseudonymEntity, {
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
		const existing: PseudonymEntity | undefined = this.em
			.getUnitOfWork()
			.getById<PseudonymEntity>(PseudonymEntity.name, domainObject.id);

		const entityProps: IPseudonymEntityProps = this.mapDomainObjectToEntityProperties(domainObject);
		let entity: PseudonymEntity = new PseudonymEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}

		await this.em.flush();

		const savedDomainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	protected mapEntityToDomainObject(entity: PseudonymEntity): Pseudonym {
		return new Pseudonym({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	protected mapDomainObjectToEntityProperties(entityDO: Pseudonym): IPseudonymEntityProps {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
