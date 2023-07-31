import { UnprocessableEntityException } from '@nestjs/common';
import { CustomParameterEntry } from '@src/modules/tool/common/entity';
import {
	BasicToolConfig,
	CustomParameter,
	ExternalToolEntity,
	IExternalToolProperties,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '@src/modules/tool/external-tool/entity';
import {
	BasicToolConfigDO,
	ExternalTool,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@src/modules/tool/external-tool/domain';
import { ToolConfigType } from '@src/modules/tool/common/enum';
import { CustomParameterDO, CustomParameterEntryDO } from '@src/modules/tool/common/domain';

// TODO: maybe rename because of usage in external tool repo and school external tool repo
export class ExternalToolRepoMapper {
	static mapEntityToDO(entity: ExternalToolEntity): ExternalTool {
		let config: BasicToolConfigDO | Oauth2ToolConfigDO | Lti11ToolConfigDO;
		switch (entity.config.type) {
			case ToolConfigType.BASIC:
				config = this.mapBasicToolConfigToDO(entity.config as BasicToolConfigDO);
				break;
			case ToolConfigType.OAUTH2:
				config = this.mapOauth2ConfigToDO(entity.config as Oauth2ToolConfigDO);
				break;
			case ToolConfigType.LTI11:
				config = this.mapLti11ToolConfigToDO(entity.config as Lti11ToolConfigDO);
				break;
			default:
				/* istanbul ignore next */
				throw new UnprocessableEntityException(`Unknown config type.`);
		}

		return new ExternalTool({
			id: entity.id,
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

	static mapBasicToolConfigToDO(lti11Config: BasicToolConfig): BasicToolConfigDO {
		return new BasicToolConfigDO({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	static mapOauth2ConfigToDO(oauth2Config: Oauth2ToolConfig): Oauth2ToolConfigDO {
		return new Oauth2ToolConfigDO({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	static mapLti11ToolConfigToDO(lti11Config: Lti11ToolConfig): Lti11ToolConfigDO {
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

	static mapDOToEntityProperties(entityDO: ExternalTool): IExternalToolProperties {
		let config: BasicToolConfig | Oauth2ToolConfig | Lti11ToolConfig;
		switch (entityDO.config.type) {
			case ToolConfigType.BASIC:
				config = this.mapBasicToolConfigDOToEntity(entityDO.config as BasicToolConfigDO);
				break;
			case ToolConfigType.OAUTH2:
				config = this.mapOauth2ConfigDOToEntity(entityDO.config as Oauth2ToolConfigDO);
				break;
			case ToolConfigType.LTI11:
				config = this.mapLti11ToolConfigDOToEntity(entityDO.config as Lti11ToolConfigDO);
				break;
			default:
				/* istanbul ignore next */
				throw new UnprocessableEntityException(`Unknown config type.`);
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

	static mapBasicToolConfigDOToEntity(lti11Config: BasicToolConfigDO): BasicToolConfig {
		return new BasicToolConfig({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	static mapOauth2ConfigDOToEntity(oauth2Config: Oauth2ToolConfigDO): Oauth2ToolConfig {
		return new Oauth2ToolConfig({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	static mapLti11ToolConfigDOToEntity(lti11Config: Lti11ToolConfigDO): Lti11ToolConfig {
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

	static mapCustomParametersToDOs(customParameters: CustomParameter[]): CustomParameterDO[] {
		return customParameters.map(
			(param: CustomParameter) =>
				new CustomParameterDO({
					name: param.name,
					displayName: param.displayName,
					description: param.description,
					default: param.default,
					regex: param.regex,
					regexComment: param.regexComment,
					scope: param.scope,
					location: param.location,
					type: param.type,
					isOptional: param.isOptional,
				})
		);
	}

	static mapCustomParameterDOsToEntities(customParameters: CustomParameterDO[]): CustomParameter[] {
		return customParameters.map(
			(param: CustomParameterDO) =>
				new CustomParameter({
					name: param.name,
					displayName: param.displayName,
					description: param.description,
					default: param.default,
					regex: param.regex,
					regexComment: param.regexComment,
					scope: param.scope,
					location: param.location,
					type: param.type,
					isOptional: param.isOptional,
				})
		);
	}

	static mapCustomParameterEntryEntitiesToDOs(entries: CustomParameterEntry[]): CustomParameterEntryDO[] {
		return entries.map(
			(entry: CustomParameterEntry): CustomParameterEntryDO =>
				new CustomParameterEntryDO({
					name: entry.name,
					value: entry.value,
				})
		);
	}

	static mapCustomParameterEntryDOsToEntities(entries: CustomParameterEntryDO[]): CustomParameterEntry[] {
		return entries.map(
			(entry: CustomParameterEntry): CustomParameterEntryDO =>
				new CustomParameterEntry({
					name: entry.name,
					value: entry.value,
				})
		);
	}
}
