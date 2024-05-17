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
		const entityProps: ExternalToolEntityProps = this.mapDomainObjectToEntityProps(domainObject);
		const entity: ExternalToolEntity = new ExternalToolEntity(entityProps);

		await this.em.persistAndFlush(entity);

		const savedDomainObject: ExternalTool = this.mapEntityToDomainObject(entity);

		return savedDomainObject;
	}

	public async findById(id: EntityId): Promise<ExternalTool> {
		const entity: ExternalToolEntity = await this.em.findOneOrFail(this.entityName, { id });
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

	public async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		const entities: ExternalToolEntity[] = await this.em.find(this.entityName, { config: { type } });
		const domainObjects: ExternalTool[] = entities.map((entity: ExternalToolEntity): ExternalTool => {
			const domainObject: ExternalTool = this.mapEntityToDomainObject(entity);
			return domainObject;
		});
		return domainObjects;
	}

	public async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this.em.findOne(this.entityName, { config: { clientId } });
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
}
