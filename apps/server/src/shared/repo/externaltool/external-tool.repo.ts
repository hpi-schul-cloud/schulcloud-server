import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import {
	ExternalTool,
	IExternalToolProperties,
	IFindOptions,
	IPagination,
	Page,
	SortOrder,
	ToolConfigType,
} from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/tool';
import { BaseDORepo, Scope } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchQuery } from 'apps/server/src/modules/tool/common/interface';
import { ExternalToolSortingMapper } from './external-tool-sorting.mapper';
import { ExternalToolRepoMapper } from './external-tool.repo.mapper';
import { ExternalToolScope } from './external-tool.scope';

@Injectable()
export class ExternalToolRepo extends BaseDORepo<ExternalToolDO, ExternalTool, IExternalToolProperties> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: LegacyLogger,
		protected readonly sortingMapper: ExternalToolSortingMapper
	) {
		super(_em, logger);
	}

	get entityName(): EntityName<ExternalTool> {
		return ExternalTool;
	}

	entityFactory(props: IExternalToolProperties): ExternalTool {
		return new ExternalTool(props);
	}

	async findByName(name: string): Promise<ExternalToolDO | null> {
		const entity: ExternalTool | null = await this._em.findOne(this.entityName, { name });
		if (entity !== null) {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalToolDO[]> {
		const entities: ExternalTool[] = await this._em.find(this.entityName, { config: { type } });
		const domainObjects: ExternalToolDO[] = entities.map((entity: ExternalTool): ExternalToolDO => {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalToolDO | null> {
		const entity: ExternalTool | null = await this._em.findOne(this.entityName, { config: { clientId } });
		if (entity !== null) {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async find(query: ExternalToolSearchQuery, options?: IFindOptions<ExternalToolDO>): Promise<Page<ExternalToolDO>> {
		const pagination: IPagination = options?.pagination || {};
		const order: QueryOrderMap<ExternalTool> = this.sortingMapper.mapDOSortOrderToQueryOrder(options?.order || {});
		const scope: Scope<ExternalTool> = new ExternalToolScope()
			.byName(query.name)
			.byClientId(query.clientId)
			.byHidden(query.isHidden)
			.allowEmptyQuery(true);

		if (order._id == null) {
			order._id = SortOrder.asc;
		}

		const [entities, total]: [ExternalTool[], number] = await this._em.findAndCount(ExternalTool, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		const entityDos: ExternalToolDO[] = entities.map((entity) => this.mapEntityToDO(entity));
		const page: Page<ExternalToolDO> = new Page<ExternalToolDO>(entityDos, total);
		return page;
	}

	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		return this.externalToolRepoMapper.mapEntityToDO(entity);
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): IExternalToolProperties {
		return this.externalToolRepoMapper.mapDOToEntityProperties(entityDO);
	}
}
