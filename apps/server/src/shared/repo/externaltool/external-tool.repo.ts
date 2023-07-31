import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { IFindOptions, IPagination, Page, SortOrder } from '@shared/domain';
import { BaseDORepo, ExternalToolRepoMapper, ExternalToolSortingMapper, Scope } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ToolConfigType } from '@src/modules/tool/common/enum';
import { ExternalToolSearchQuery } from '@src/modules/tool/common/interface';
import { ExternalTool } from '@src/modules/tool/external-tool/domain';
import { ExternalToolEntity, IExternalToolProperties } from '@src/modules/tool/external-tool/entity';
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
		return ExternalToolRepoMapper.mapEntityToDO(entity);
	}

	mapDOToEntityProperties(entityDO: ExternalTool): IExternalToolProperties {
		return ExternalToolRepoMapper.mapDOToEntityProperties(entityDO);
	}
}
