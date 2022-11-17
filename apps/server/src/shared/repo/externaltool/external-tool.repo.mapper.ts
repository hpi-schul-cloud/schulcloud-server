import {
	BasicToolConfig,
	CustomParameter,
	ExternalTool,
	IExternalToolProperties,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '@shared/domain';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { EntityProperties } from '@shared/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalToolRepoMapper {
	mapEntityToDO(entity: ExternalTool): ExternalToolDO {
		let config: BasicToolConfigDO | Oauth2ToolConfigDO | Lti11ToolConfigDO;
		if (entity.config instanceof BasicToolConfig) {
			config = this.mapBasicToolConfigToDO(entity.config);
		} else if (entity.config instanceof Oauth2ToolConfig) {
			config = this.mapOauth2ConfigToDO(entity.config);
		} else {
			config = this.mapLti11ToolConfigToDO(entity.config);
		}

		return new ExternalToolDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			name: entity.name,
			url: entity.url,
			logoUrl: entity.logoUrl,
			config,
			parameters: this.mapCustomParametersToDOs(entity.parameters || []),
			isHidden: entity.isHidden,
			openNewTab: entity.openNewTab,
			version: entity.version,
		});
	}

	mapBasicToolConfigToDO(lti11Config: BasicToolConfig): BasicToolConfigDO {
		return new BasicToolConfigDO({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	mapOauth2ConfigToDO(oauth2Config: Oauth2ToolConfig): Oauth2ToolConfigDO {
		return new Oauth2ToolConfigDO({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	mapLti11ToolConfigToDO(lti11Config: Lti11ToolConfig): Lti11ToolConfigDO {
		return new Lti11ToolConfigDO({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
			key: lti11Config.key,
			secret: lti11Config.secret,
			lti_message_type: lti11Config.lti_message_type,
			resource_link_id: lti11Config.resource_link_id,
			privacy_permission: lti11Config.privacy_permission,
		});
	}

	mapCustomParametersToDOs(customParameters: CustomParameter[]): CustomParameterDO[] {
		return customParameters.map((param: CustomParameter) => {
			return new CustomParameterDO({
				name: param.name,
				default: param.default,
				regex: param.regex,
				scope: param.scope,
				location: param.location,
				type: param.type,
			});
		});
	}

	mapDOToEntityProperties(entityDO: ExternalToolDO): EntityProperties<IExternalToolProperties> {
		let config: BasicToolConfig | Oauth2ToolConfig | Lti11ToolConfig;
		if (entityDO.config instanceof BasicToolConfigDO) {
			config = this.mapBasicToolConfigDOToEntity(entityDO.config);
		} else if (entityDO.config instanceof Oauth2ToolConfigDO) {
			config = this.mapOauth2ConfigDOToEntity(entityDO.config);
		} else {
			config = this.mapLti11ToolConfigDOToEntity(entityDO.config);
		}

		return {
			name: entityDO.name,
			url: entityDO.url,
			logoUrl: entityDO.logoUrl,
			config,
			parameters: this.mapCustomParameterDOsToEntities(entityDO.parameters ?? []),
			isHidden: entityDO.isHidden,
			openNewTab: entityDO.openNewTab,
			version: entityDO.version,
		};
	}

	mapBasicToolConfigDOToEntity(lti11Config: BasicToolConfigDO): BasicToolConfig {
		return new BasicToolConfig({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	mapOauth2ConfigDOToEntity(oauth2Config: Oauth2ToolConfigDO): Oauth2ToolConfig {
		return new Oauth2ToolConfig({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	mapLti11ToolConfigDOToEntity(lti11Config: Lti11ToolConfigDO): Lti11ToolConfig {
		return new Lti11ToolConfig({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
			key: lti11Config.key,
			secret: lti11Config.secret,
			lti_message_type: lti11Config.lti_message_type,
			resource_link_id: lti11Config.resource_link_id,
			privacy_permission: lti11Config.privacy_permission,
		});
	}

	mapCustomParameterDOsToEntities(customParameters: CustomParameterDO[]): CustomParameter[] {
		return customParameters.map((param: CustomParameterDO) => {
			return new CustomParameter({
				name: param.name,
				default: param.default,
				regex: param.regex,
				scope: param.scope,
				location: param.location,
				type: param.type,
			});
		});
	}
}
