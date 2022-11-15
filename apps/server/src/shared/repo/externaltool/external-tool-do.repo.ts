import { BaseDORepo, EntityProperties } from '@shared/repo';
import {
	CustomParameter,
	ExternalTool,
	IExternalToolProperties,
	ToolConfigType,
} from '@shared/domain/entity/external-tools';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { EntityName } from '@mikro-orm/core';
import { CustomParameterDO, ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';

@Injectable()
export class ExternalToolDORepo extends BaseDORepo<ExternalToolDO, ExternalTool, IExternalToolProperties> {
	get entityName(): EntityName<ExternalTool> {
		return ExternalTool;
	}

	entityFactory(props: IExternalToolProperties): ExternalTool {
		return new ExternalTool(props);
	}

	async findByName(name: string): Promise<ExternalTool | null> {
		return this._em.findOne(ExternalTool, { name });
	}

	async findAllByConfigType(type: ToolConfigType): Promise<ExternalTool[]> {
		return this._em.find(ExternalTool, { config: { type } });
	}

	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		return new ExternalToolDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			name: entity.name,
			url: entity.url,
			logoUrl: entity.logoUrl,
			config: entity.config,
			parameters: entity.parameters || [], // TODO mapping
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
			parameters: this.mapToCustomParameter(entityDO.parameters),
			isHidden: entityDO.isHidden,
			openNewTab: entityDO.openNewTab,
			version: entityDO.version,
		};
	}

	mapToCustomParameter(customParameter: CustomParameterDO[]): CustomParameter[] {
		return customParameter.map((customParam: CustomParameterDO) => {
			return {
				name: customParam.name,
				default: customParam.default,
				regex: customParam.regex || '',
				scope: customParam.scope,
				location: customParam.location,
				type: customParam.type,
			} as CustomParameter;
		});
	}
}
