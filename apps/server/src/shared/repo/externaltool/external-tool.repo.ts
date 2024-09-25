import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ToolConfigType } from '@modules/tool/common/enum';
import { ExternalToolSearchQuery } from '@modules/tool/common/interface';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolEntity, ExternalToolEntityProps } from '@modules/tool/external-tool/entity';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Pagination, SortOrder } from '@shared/domain/interface';
import { ExternalToolRepoMapper, ExternalToolSortingMapper, Scope } from '@shared/repo';
import { EntityId } from '../../domain/types';
import { ExternalToolScope } from './external-tool.scope';

@Injectable()
export class ExternalToolRepo {
	constructor(protected readonly em: EntityManager) {}

	get entityName(): EntityName<ExternalToolEntity> {
		return ExternalToolEntity;
	}

	public async save(domainObject: ExternalTool): Promise<ExternalTool> {
		const existing: ExternalToolEntity | null = await this.em.findOne(this.entityName, domainObject.id, {
			populate: ['thumbnail.fileRecord'],
		});

		const entityProps: ExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		let entity: ExternalToolEntity = new ExternalToolEntity(entityProps);

		if (existing) {
			entity = this.em.assign(existing, entity);
		} else {
			this.em.persist(entity);
		}
		await this.em.flush();

		const savedDomainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	public async findById(id: EntityId): Promise<ExternalTool> {
		const entity: ExternalToolEntity = await this.em.findOneOrFail(this.entityName, id, {
			populate: ['thumbnail.fileRecord'],
		});
		const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return domainObject;
	}

	public async deleteById(id: EntityId): Promise<void> {
		await this.em.removeAndFlush(this.em.getReference(this.entityName, id));
	}

	public async findByName(name: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(
			this.entityName,
			{ name },
			{
				populate: ['thumbnail.fileRecord'],
			}
		);
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
	}

	public async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		const entities: ExternalToolEntity[] = await this.em.find(
			this.entityName,
			{ config: { type } },
			{
				populate: ['thumbnail.fileRecord'],
			}
		);
		const domainObjects: ExternalTool[] = entities.map((entity: ExternalToolEntity): ExternalTool => {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});
		return domainObjects;
	}

	public async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(
			this.entityName,
			{ config: { clientId } },
			{
				populate: ['thumbnail.fileRecord'],
			}
		);
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
	}

	public async findByMedium(mediumId: string, mediaSourceId?: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(
			this.entityName,
			{
				medium: { mediumId, mediaSourceId },
			},
			{
				populate: ['thumbnail.fileRecord'],
			}
		);
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		}
		return null;
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
				populate: ['thumbnail.fileRecord'],
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
		const entity = ExternalToolRepoMapper.mapDOToEntityProperties(entityDO, this.em);

		return entity;
	}
}
