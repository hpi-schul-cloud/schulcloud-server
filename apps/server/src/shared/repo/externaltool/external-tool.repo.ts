import { BaseRepo, EntityProperties } from '@shared/repo';
import { ExternalTool, IExternalToolProperties, ToolConfigType } from '@shared/domain/entity/external-tool';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityName } from '@mikro-orm/core';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';

@Injectable()
export class ExternalToolRepo extends BaseRepo<ExternalTool> {
	get entityName(): EntityName<ExternalTool> {
		return ExternalTool;
	}

	async findByName(name: string): Promise<ExternalTool | null> {
		return this._em.findOne(ExternalTool, { name });
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		return this._em.find(ExternalTool, { config: { type } });
	}

	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		return new ExternalToolDO({
			name: entity.name,
			url: entity.url,
			logoUrl: entity.logoUrl,
			config: entity.config,
			parameters: entity.parameters,
			isHidden: entity.isHidden,
			openNewTab: entity.openNewTab,
			version: entity.version,
		});
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): EntityProperties<IExternalToolProperties> {
		return {
			name: entityDO.name,
			url: entityDO.url,
			logoUrl: entityDO.logoUrl,
			config: entityDO.config,
			parameters: entityDO.parameters,
			isHidden: entityDO.isHidden,
			openNewTab: entityDO.openNewTab,
			version: entityDO.version,
		};
	}
}
