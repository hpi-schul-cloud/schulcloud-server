import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Page } from '@shared/domain/domainobject/page';
import { IFindOptions, IPagination, SortOrder } from '@shared/domain/interface/find-options';
import { Scope } from '@shared/repo/scope';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { ExternalToolSearchQuery } from '@src/modules/tool/common/interface/external-tool-search-query';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import {
	ExternalToolEntity,
	IExternalToolProperties,
} from '@src/modules/tool/external-tool/entity/external-tool.entity';
import { BaseDORepo } from '../base.do.repo';
import { ExternalToolSortingMapper } from './external-tool-sorting.mapper';
import { ExternalToolRepoMapper } from './external-tool.repo.mapper';
import { ExternalToolScope } from './external-tool.scope';

@Injectable()
export class ExternalToolRepo extends BaseDORepo<ExternalTool, ExternalToolEntity, IExternalToolProperties> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<ExternalToolEntity> {
		return ExternalToolEntity;
	}

	entityFactory(props: IExternalToolProperties): ExternalToolEntity {
		return new ExternalToolEntity(props);
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
		const pagination: IPagination = options?.pagination || {};
		const order: QueryOrderMap<ExternalToolEntity> = ExternalToolSortingMapper.mapDOSortOrderToQueryOrder(
			options?.order || {}
		);
		const scope: Scope<ExternalToolEntity> = new ExternalToolScope()
			.byName(query.name)
			.byClientId(query.clientId)
			.byHidden(query.isHidden)
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

	mapDOToEntityProperties(entityDO: ExternalTool): IExternalToolProperties {
		const entity = ExternalToolRepoMapper.mapDOToEntityProperties(entityDO);

		return entity;
	}
}
