import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { IFindOptions, IPagination, Page, SortOrder } from '@shared/domain';
import { BaseDORepo, ExternalToolRepoMapper, ExternalToolSortingMapper, Scope } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ToolConfigType } from '@src/modules/tool/common/enum';
import { ExternalToolSearchQuery } from '@src/modules/tool/common/interface';
import { ExternalToolDO } from '@src/modules/tool/external-tool/domain';
import { ExternalToolEntity, IExternalToolProperties } from '@src/modules/tool/external-tool/entity';
import { ExternalToolScope } from './external-tool.scope';

@Injectable()
export class ExternalToolRepo extends BaseDORepo<ExternalToolDO, ExternalToolEntity, IExternalToolProperties> {
	constructor(protected readonly _em: EntityManager, protected readonly logger: LegacyLogger) {
		super(_em, logger);
	}

	get entityName(): EntityName<ExternalToolEntity> {
		return ExternalToolEntity;
	}

	entityFactory(props: IExternalToolProperties): ExternalToolEntity {
		return new ExternalToolEntity(props);
	}

	async findByName(name: string): Promise<ExternalToolDO | null> {
		const entity: ExternalToolEntity | null = await this._em.findOne(this.entityName, { name });
		if (entity !== null) {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalToolDO[]> {
		const entities: ExternalToolEntity[] = await this._em.find(this.entityName, { config: { type } });
		const domainObjects: ExternalToolDO[] = entities.map((entity: ExternalToolEntity): ExternalToolDO => {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		});
		return domainObjects;
	}

	async findByOAuth2ConfigClientId(clientId: string): Promise<ExternalToolDO | null> {
		const entity: ExternalToolEntity | null = await this._em.findOne(this.entityName, { config: { clientId } });
		if (entity !== null) {
			const domainObject: ExternalToolDO = this.mapEntityToDO(entity);
			return domainObject;
		}
		return null;
	}

	async find(query: ExternalToolSearchQuery, options?: IFindOptions<ExternalToolDO>): Promise<Page<ExternalToolDO>> {
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

		const entityDos: ExternalToolDO[] = entities.map((entity) => this.mapEntityToDO(entity));
		const page: Page<ExternalToolDO> = new Page<ExternalToolDO>(entityDos, total);
		return page;
	}

	mapEntityToDO(entity: ExternalToolEntity): ExternalToolDO {
		return ExternalToolRepoMapper.mapEntityToDO(entity);
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): IExternalToolProperties {
		return ExternalToolRepoMapper.mapDOToEntityProperties(entityDO);
	}
}
