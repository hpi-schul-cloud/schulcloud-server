import { EntityData } from '@mikro-orm/core';
import { CustomParameter, CustomParameterEntry } from '@modules/tool/common/domain';
import { CustomParameterEntryEntity } from '@modules/tool/common/entity';
import { ToolConfigType } from '@modules/tool/common/enum';
import {
	BasicToolConfig,
	ExternalTool,
	ExternalToolMedium,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '@modules/tool/external-tool/domain';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	Lti11ToolConfigEntity,
	Oauth2ToolConfigEntity,
	ExternalToolMediumEntity,
} from '@modules/tool/external-tool/entity';
import { UnprocessableEntityException } from '@nestjs/common';

// TODO: maybe rename because of usage in external tool repo and school external tool repo
export class ExternalToolRepoMapper {
	static mapEntityToDO(entity: ExternalToolEntity): ExternalTool {
		let config: BasicToolConfig | Oauth2ToolConfig | Lti11ToolConfig;
		switch (entity.config.type) {
			case ToolConfigType.BASIC:
				config = this.mapBasicToolConfigToDO(entity.config as BasicToolConfig);
				break;
			case ToolConfigType.OAUTH2:
				config = this.mapOauth2ConfigToDO(entity.config as Oauth2ToolConfig);
				break;
			case ToolConfigType.LTI11:
				config = this.mapLti11ToolConfigToDO(entity.config as Lti11ToolConfig);
				break;
			default:
				/* istanbul ignore next */
				throw new UnprocessableEntityException(`Unknown config type.`);
		}

		return new ExternalTool({
			id: entity.id,
			name: entity.name,
			description: entity.description,
			url: entity.url,
			logoUrl: entity.logoUrl,
			logo: entity.logoBase64,
			config,
			parameters: this.mapCustomParametersToDOs(entity.parameters || []),
			isHidden: entity.isHidden,
			isDeactivated: entity.isDeactivated,
			openNewTab: entity.openNewTab,
			version: entity.version,
			restrictToContexts: entity.restrictToContexts,
			medium: this.mapExternalToolMediumEntityToDO(entity.medium),
		});
	}

	private static mapExternalToolMediumEntityToDO(entity?: ExternalToolMediumEntity): ExternalToolMedium | undefined {
		if (!entity) {
			return undefined;
		}

		return new ExternalToolMedium({
			mediumId: entity.mediumId,
			publisher: entity.publisher,
		});
	}

	static mapBasicToolConfigToDO(lti11Config: BasicToolConfigEntity): BasicToolConfig {
		return new BasicToolConfig({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	static mapOauth2ConfigToDO(oauth2Config: Oauth2ToolConfigEntity): Oauth2ToolConfig {
		return new Oauth2ToolConfig({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	static mapLti11ToolConfigToDO(lti11Config: Lti11ToolConfigEntity): Lti11ToolConfig {
		return new Lti11ToolConfig({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
			key: lti11Config.key,
			secret: lti11Config.secret,
			lti_message_type: lti11Config.lti_message_type,
			privacy_permission: lti11Config.privacy_permission,
			launch_presentation_locale: lti11Config.launch_presentation_locale,
		});
	}

	static mapDOToEntityProperties(entityDO: ExternalTool): EntityData<ExternalToolEntity> {
		let config: BasicToolConfigEntity | Oauth2ToolConfigEntity | Lti11ToolConfigEntity;
		switch (entityDO.config.type) {
			case ToolConfigType.BASIC:
				config = this.mapBasicToolConfigDOToEntity(entityDO.config as BasicToolConfig);
				break;
			case ToolConfigType.OAUTH2:
				config = this.mapOauth2ConfigDOToEntity(entityDO.config as Oauth2ToolConfig);
				break;
			case ToolConfigType.LTI11:
				config = this.mapLti11ToolConfigDOToEntity(entityDO.config as Lti11ToolConfig);
				break;
			default:
				/* istanbul ignore next */
				throw new UnprocessableEntityException(`Unknown config type.`);
		}

		return {
			name: entityDO.name,
			description: entityDO.description,
			url: entityDO.url,
			logoUrl: entityDO.logoUrl,
			logoBase64: entityDO.logo,
			config,
			parameters: this.mapCustomParameterDOsToEntities(entityDO.parameters ?? []),
			isHidden: entityDO.isHidden,
			isDeactivated: entityDO.isDeactivated,
			openNewTab: entityDO.openNewTab,
			version: entityDO.version,
			restrictToContexts: entityDO.restrictToContexts,
			medium: this.mapExternalToolMediumDOToEntity(entityDO.medium),
		};
	}

	private static mapExternalToolMediumDOToEntity(medium?: ExternalToolMedium): ExternalToolMediumEntity | undefined {
		if (!medium) {
			return undefined;
		}

		return new ExternalToolMediumEntity({
			mediumId: medium.mediumId,
			publisher: medium.publisher,
		});
	}

	static mapBasicToolConfigDOToEntity(lti11Config: BasicToolConfig): BasicToolConfigEntity {
		return new BasicToolConfigEntity({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
		});
	}

	static mapOauth2ConfigDOToEntity(oauth2Config: Oauth2ToolConfig): Oauth2ToolConfigEntity {
		return new Oauth2ToolConfigEntity({
			type: oauth2Config.type,
			baseUrl: oauth2Config.baseUrl,
			clientId: oauth2Config.clientId,
			skipConsent: oauth2Config.skipConsent,
		});
	}

	static mapLti11ToolConfigDOToEntity(lti11Config: Lti11ToolConfig): Lti11ToolConfigEntity {
		return new Lti11ToolConfigEntity({
			type: lti11Config.type,
			baseUrl: lti11Config.baseUrl,
			key: lti11Config.key,
			secret: lti11Config.secret,
			lti_message_type: lti11Config.lti_message_type,
			privacy_permission: lti11Config.privacy_permission,
			launch_presentation_locale: lti11Config.launch_presentation_locale,
		});
	}

	static mapCustomParametersToDOs(customParameters: CustomParameterEntity[]): CustomParameter[] {
		return customParameters.map(
			(param: CustomParameterEntity) =>
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
					isProtected: param.isProtected,
				})
		);
	}

	static mapCustomParameterDOsToEntities(customParameters: CustomParameter[]): CustomParameterEntity[] {
		return customParameters.map(
			(param: CustomParameter) =>
				new CustomParameterEntity({
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
					isProtected: param.isProtected,
				})
		);
	}

	static mapCustomParameterEntryEntitiesToDOs(entries: CustomParameterEntryEntity[]): CustomParameterEntry[] {
		return entries.map(
			(entry: CustomParameterEntryEntity): CustomParameterEntry =>
				new CustomParameterEntry({
					name: entry.name,
					value: entry.value,
				})
		);
	}

	static mapCustomParameterEntryDOsToEntities(entries: CustomParameterEntry[]): CustomParameterEntryEntity[] {
		return entries.map(
			(entry: CustomParameterEntryEntity): CustomParameterEntry =>
				new CustomParameterEntryEntity({
					name: entry.name,
					value: entry.value,
				})
		);
	}
}
