import { BaseDORepo, EntityProperties } from '@shared/repo';
import { ExternalTool, IExternalToolProperties, ToolConfigType } from '@shared/domain/entity/external-tools';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityName } from '@mikro-orm/core';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '@src/core/logger';

@Injectable()
export class ExternalToolRepo extends BaseDORepo<ExternalToolDO, ExternalTool, IExternalToolProperties> {
	constructor(
		private readonly externalToolRepoMapper: ExternalToolRepoMapper,
		protected readonly _em: EntityManager,
		protected readonly logger: Logger
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

	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		return this.externalToolRepoMapper.mapEntityToDO(entity);
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): EntityProperties<IExternalToolProperties> {
		return this.externalToolRepoMapper.mapDOToEntityProperties(entityDO);
	}
}
