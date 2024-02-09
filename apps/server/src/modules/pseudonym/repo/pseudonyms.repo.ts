import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Pseudonym } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { PseudonymEntity, PseudonymEntityProps } from '../entity';

@Injectable()
export class PseudonymsRepo {
	constructor(private readonly em: EntityManager) {}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: PseudonymEntity = await this.em.findOneOrFail(PseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return domainObject;
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

	async findByUserId(userId: EntityId): Promise<Pseudonym[]> {
		const entities: PseudonymEntity[] = await this.em.find(PseudonymEntity, { userId: new ObjectId(userId) });

		const pseudonyms: Pseudonym[] = entities.map((entity) => this.mapEntityToDomainObject(entity));

		return pseudonyms;
	}

	async createOrUpdate(domainObject: Pseudonym): Promise<Pseudonym> {
		const existing: PseudonymEntity | undefined = this.em
			.getUnitOfWork()
			.getById<PseudonymEntity>(PseudonymEntity.name, domainObject.id);

		const entityProps: PseudonymEntityProps = this.mapDomainObjectToEntityProperties(domainObject);
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

	async deletePseudonymsByUserId(userId: EntityId): Promise<EntityId[]> {
		const pseudonyms = await this.em.find(PseudonymEntity, { userId: new ObjectId(userId) });
		if (pseudonyms.length === 0) {
			return [];
		}

		const removePromises = pseudonyms.map((pseudonym) => this.em.removeAndFlush(pseudonym));

		await Promise.all(removePromises);

		return this.getPseudonymId(pseudonyms);
	}

	private getPseudonymId(pseudonyms: PseudonymEntity[]): EntityId[] {
		return pseudonyms.map((pseudonym) => pseudonym.id);
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

	protected mapDomainObjectToEntityProperties(entityDO: Pseudonym): PseudonymEntityProps {
		return {
			id: entityDO.id,
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}
}
