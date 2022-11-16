import { BaseDORepo, EntityProperties } from '@shared/repo';
import { ExternalTool, IExternalToolProperties, ToolConfigType } from '@shared/domain/entity/external-tools';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityName } from '@mikro-orm/core';
import { ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '@src/core/logger';

@Injectable()
export class ExternalToolDORepo extends BaseDORepo<ExternalToolDO, ExternalTool, IExternalToolProperties> {
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

	findByName(name: string): Promise<ExternalTool | null> {
		return this._em.findOne(ExternalTool, { name });
	}

	findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		return this._em.find(ExternalTool, { config: { type } });
	}

	findByOAuth2ConfigClientId(oauth2Config: Oauth2ToolConfigDO): Promise<ExternalTool | null> {
		return this._em.findOne(ExternalTool, { config: { clientId: oauth2Config.clientId } });
	}

	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		return this.externalToolRepoMapper.mapEntityToDO(entity);
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): EntityProperties<IExternalToolProperties> {
		return this.externalToolRepoMapper.mapDOToEntityProperties(entityDO);
	}
}
