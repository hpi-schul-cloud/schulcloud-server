import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Pagination } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { v4 as uuidv4 } from 'uuid';
import { PseudonymSearchQuery } from '../domain';
import { ExternalToolPseudonymEntity } from '../entity';
import { PseudonymScope } from '../entity/pseudonym.scope';
import { Pseudonym } from './pseudonym.do';

@Injectable()
export class ExternalToolPseudonymRepo {
	constructor(private readonly em: EntityManager) {}

	public async findByUserIdAndToolIdOrFail(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const entity: ExternalToolPseudonymEntity = await this.em.findOneOrFail(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
			toolId: new ObjectId(toolId),
		});

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public async findByUserId(userId: EntityId): Promise<Pseudonym[]> {
		const entities: ExternalToolPseudonymEntity[] = await this.em.find(ExternalToolPseudonymEntity, {
			userId: new ObjectId(userId),
		});
		const pseudonyms: Pseudonym[] = entities.map((entity) => this.mapEntityToDomainObject(entity));

		return pseudonyms;
	}

	public async findOrCreate(userId: EntityId, toolId: EntityId): Promise<Pseudonym> {
		const collection = this.em.getCollection(ExternalToolPseudonymEntity);

		const now = new Date();

		const result = await collection.findOneAndUpdate(
			{ userId: new ObjectId(userId), toolId: new ObjectId(toolId) },
			{
				$setOnInsert: {
					createdAt: now,
					updatedAt: now,
					pseudonym: uuidv4(),
				},
			},
			{
				upsert: true,
				returnDocument: 'after',
			}
		);

		/* istanbul ignore next */
		if (!result) {
			throw new InternalServerErrorException('unexpected null result from findOneAndUpdate');
		}

		return new Pseudonym({
			id: result._id.toHexString(),
			pseudonym: result.pseudonym,
			toolId: result.toolId.toHexString(),
			userId: result.userId.toHexString(),
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
		});
	}

	public async deletePseudonymsByUserId(userId: EntityId): Promise<EntityId[]> {
		const externalPseudonyms = await this.em.find(ExternalToolPseudonymEntity, { userId: new ObjectId(userId) });
		if (externalPseudonyms.length === 0) {
			return [];
		}

		for (const pseudonym of externalPseudonyms) {
			this.em.remove(pseudonym);
		}
		await this.em.flush();

		const deletedIds = this.getExternalPseudonymId(externalPseudonyms);
		return deletedIds;
	}

	public async findByPseudonym(pseudonym: string): Promise<Pseudonym | null> {
		const entities: ExternalToolPseudonymEntity | null = await this.em.findOne(ExternalToolPseudonymEntity, {
			pseudonym,
		});

		if (!entities) {
			return null;
		}

		const domainObject: Pseudonym = this.mapEntityToDomainObject(entities);

		return domainObject;
	}

	private getExternalPseudonymId(externalPseudonyms: ExternalToolPseudonymEntity[]): EntityId[] {
		return externalPseudonyms.map((externalPseudonym) => externalPseudonym.id);
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

	public async findByQuery(query: PseudonymSearchQuery, options?: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		const pagination: Pagination = options?.pagination ?? {};
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
