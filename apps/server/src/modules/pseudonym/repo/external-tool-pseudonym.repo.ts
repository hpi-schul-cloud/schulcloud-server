import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, IPagination, Page, Pseudonym } from '@shared/domain';
import { Scope } from '@shared/repo';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymEntity, IExternalToolPseudonymEntityProps } from '../entity';
import { PseudonymScope } from '../entity/pseudonym.scope';

@Injectable()
export class ExternalToolPseudonymRepo {
	constructor(private readonly em: EntityManager) {}

	async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: ExternalToolPseudonymEntity = await this.em.findOneOrFail(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return domainObject;
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

	async findByUserId(userId: EntityId): Promise<Pseudonym[]> {
		const entities: ExternalToolPseudonymEntity[] = await this.em.find(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
		});
		const pseudonyms: Pseudonym[] = entities.map((entity) => this.mapEntityToDomainObject(entity));

		return pseudonyms;
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

	async deletePseudonymsByUserId(userId: EntityId): Promise<number> {
		const promise: Promise<number> = this.em.nativeDelete(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
		});

		return promise;
	}

	async findPseudonymByPseudonym(pseudonym: string): Promise<Pseudonym | null> {
		const entities: ExternalToolPseudonymEntity[] = await this.em.find(ExternalToolPseudonymEntity, { pseudonym });

		if (!entities || entities.length === 0) {
			return null;
		}

		if (entities.length > 1) {
			// TODO: use loggable @arne
			throw new Error(`More than one pseudonym found for pseudonym ${pseudonym}`);
		}

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entities[0]);

		return domainObject;
	}

	protected mapEntityToDomainObject(entity: ExternalToolPseudonymEntity): Pseudonym {
		const pseudonym = new Pseudonym({
			id: entity.id,
			pseudonym: entity.pseudonym,
			toolId: entity.toolId.toHexString(),
			userId: entity.userId.toHexString(),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});

		return pseudonym;
	}

	protected mapDomainObjectToEntityProperties(entityDO: Pseudonym): IExternalToolPseudonymEntityProps {
		return {
			pseudonym: entityDO.pseudonym,
			toolId: new ObjectId(entityDO.toolId),
			userId: new ObjectId(entityDO.userId),
		};
	}

	async findPseudonym(query: PseudonymSearchQuery, options?: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		const pagination: IPagination = options?.pagination ?? {};
		const scope: Scope<ExternalToolPseudonymEntity> = new PseudonymScope()
			.byPseudonym(query.pseudonym)
			.byToolId(query.toolId)
			.byUserId(query.userId)
			.allowEmptyQuery(true);

		const [entities, total] = await this.em.findAndCount(ExternalToolPseudonymEntity, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
		});

		const entityDos: Pseudonym[] = entities.map((entity) => this.mapEntityToDomainObject(entity));
		const page: Page<Pseudonym> = new Page<Pseudonym>(entityDos, total);

		return page;
	}
}
