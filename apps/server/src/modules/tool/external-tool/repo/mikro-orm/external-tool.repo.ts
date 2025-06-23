import { EntityName, QueryOrderMap, UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ValidationError } from '@shared/common/error';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Pagination, SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { ExternalToolSearchQuery } from '../../../common/interface';
import { ExternalTool } from '../../domain';
import { ExternalToolMediumStatus } from '../../enum';
import { ExternalToolEntity, ExternalToolEntityProps } from './external-tool.entity';
import { ExternalToolScope } from './external-tool.scope';
import { ExternalToolRepoMapper, ExternalToolSortingMapper } from './mapper';

@Injectable()
export class ExternalToolRepo {
	constructor(protected readonly em: EntityManager) {}

	get entityName(): EntityName<ExternalToolEntity> {
		return ExternalToolEntity;
	}

	public async save(domainObject: ExternalTool): Promise<ExternalTool> {
		const existing: ExternalToolEntity | null = await this.em.findOne(this.entityName, domainObject.id);

		const entityProps: ExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		let entity: ExternalToolEntity = new ExternalToolEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}

		try {
			await this.em.flush();
		} catch (e: unknown) {
			if (e instanceof UniqueConstraintViolationException) {
				throw new ValidationError(e.toString());
			} else {
				throw new InternalServerErrorException(e);
			}
		}

		const savedDomainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	public async saveAll(domainObjects: ExternalTool[]): Promise<ExternalTool[]> {
		this.em.clear();

		const savedDomainObjects: ExternalTool[] = await Promise.all(
			domainObjects.map(
				async (domainObject: ExternalTool): Promise<ExternalTool> => this.saveWithoutFlush(domainObject)
			)
		);

		await this.em.flush();

		return savedDomainObjects;
	}

	public async findById(id: EntityId): Promise<ExternalTool> {
		const entity: ExternalToolEntity = await this.em.findOneOrFail(this.entityName, id);
		const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public async deleteById(id: EntityId): Promise<void> {
		await this.em.removeAndFlush(this.em.getReference(this.entityName, id));
	}

	public async findByName(name: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(this.entityName, { name });
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
	}

	public async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(this.entityName, { config: { clientId } });
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
	}

	public async findByMedium(mediumId: string, mediaSourceId?: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(this.entityName, {
			medium: { mediumId, mediaSourceId },
		});
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
	}

	public async findTemplate(mediaSourceId?: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(this.entityName, {
			medium: { mediaSourceId, status: ExternalToolMediumStatus.TEMPLATE },
		});

		if (!entity) {
			return null;
		}

		const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public async findAllByMediaSource(mediaSourceId: string): Promise<ExternalTool[]> {
		const entities: ExternalToolEntity[] = await this.em.find(this.entityName, {
			medium: { mediaSourceId, status: { $ne: ExternalToolMediumStatus.TEMPLATE } },
		});

		const domainObjects: ExternalTool[] = entities.map((entity: ExternalToolEntity): ExternalTool => {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});

		return domainObjects;
	}

	public async findAllByName(name: string): Promise<ExternalTool[]> {
		const entities: ExternalToolEntity[] = await this.em.find(this.entityName, { name });

		const domainObjects: ExternalTool[] = entities.map((entity: ExternalToolEntity): ExternalTool => {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});

		return domainObjects;
	}

	public async find(query: ExternalToolSearchQuery, options?: IFindOptions<ExternalTool>): Promise<Page<ExternalTool>> {
		const pagination: Pagination = options?.pagination || {};
		const order: QueryOrderMap<ExternalToolEntity> = ExternalToolSortingMapper.mapDOSortOrderToQueryOrder(
			options?.order || {}
		);
		const scope: Scope<ExternalToolEntity> = new ExternalToolScope()
			.byName(query.name)
			.byClientId(query.clientId)
			.byHidden(query.isHidden)
			.byIds(query.ids)
			.byPreferred(query.isPreferred)
			.allowTemplateAndDraft(query.isTemplateAndDraftAllowed)
			.allowTemplate(query.isTemplateAllowed)
			.allowEmptyQuery(true);

		if (order._id == null) {
			order._id = SortOrder.asc;
		}

		const [entities, total]: [ExternalToolEntity[], number] = await this.em.findAndCount(
			ExternalToolEntity,
			scope.query,
			{
				offset: pagination?.skip,
				limit: pagination?.limit,
				orderBy: order,
			}
		);

		const entityDos: ExternalTool[] = entities.map((entity) => this.mapEntityToDomainObject(entity));
		const page: Page<ExternalTool> = new Page<ExternalTool>(entityDos, total);

		return page;
	}

	public mapEntityToDomainObject(entity: ExternalToolEntity): ExternalTool {
		const domainObject = ExternalToolRepoMapper.mapEntityToDO(entity);

		return domainObject;
	}

	private mapDomainObjectToEntityProps(entityDO: ExternalTool): ExternalToolEntityProps {
		const entity = ExternalToolRepoMapper.mapDOToEntityProperties(entityDO);

		return entity;
	}

	private async saveWithoutFlush(domainObject: ExternalTool): Promise<ExternalTool> {
		const existing: ExternalToolEntity | null = await this.em.findOne(this.entityName, domainObject.id);

		const entityProps: ExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		let entity: ExternalToolEntity = new ExternalToolEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}

		const savedDomainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}
}
