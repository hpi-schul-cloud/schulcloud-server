import { EntityData, EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ToolConfigType } from '@modules/tool/common/enum';
import { ExternalToolSearchQuery } from '@modules/tool/common/interface';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, Pagination, SortOrder } from '@shared/domain/interface';
import { BaseDORepo, ExternalToolRepoMapper, ExternalToolSortingMapper, Scope } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolScope } from './external-tool.scope';

@Injectable()
export class ExternalToolRepo extends BaseDORepo<ExternalTool, ExternalToolEntity> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<ExternalToolEntity> {
		return ExternalToolEntity;
	}

	async findByName(name: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this._em.findOne(this.entityName, { name });
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		const entities: ExternalToolEntity[] = await this._em.find(this.entityName, { config: { type } });
		const domainObjects: ExternalTool[] = entities.map((entity: ExternalToolEntity): ExternalTool => {
			const domainObject: ExternalTool = this.mapEntityToDO(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const entity: ExternalToolEntity | null = await this._em.findOne(this.entityName, { config: { clientId } });
		if (entity !== null) {
			const domainObject: ExternalTool = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async find(query: ExternalToolSearchQuery, options?: IFindOptions<ExternalTool>): Promise<Page<ExternalTool>> {
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

		const [entities, total]: [ExternalToolEntity[], number] = await this._em.findAndCount(
			ExternalToolEntity,
			scope.query,
			{
				offset: pagination?.skip,
				limit: pagination?.limit,
				orderBy: order,
			}
		);

		const entityDos: ExternalTool[] = entities.map((entity) => this.mapEntityToDO(entity));
		const page: Page<ExternalTool> = new Page<ExternalTool>(entityDos, total);

		return page;
	}

	mapEntityToDO(entity: ExternalToolEntity): ExternalTool {
		const domainObject = ExternalToolRepoMapper.mapEntityToDO(entity);

		return domainObject;
	}

	mapDOToEntityProperties(entityDO: ExternalTool): EntityData<ExternalToolEntity> {
		const entity = ExternalToolRepoMapper.mapDOToEntityProperties(entityDO);

		return entity;
	}
}
