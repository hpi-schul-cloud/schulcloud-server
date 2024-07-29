import { EntityManager } from '@mikro-orm/mongodb';
import { FileRecord } from '@modules/files-storage/entity';
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
import { FileRecordRef } from '@modules/tool/external-tool/domain/file-record-ref';
import {
	BasicToolConfigEntity,
	CustomParameterEntity,
	ExternalToolEntity,
	ExternalToolEntityProps,
	ExternalToolMediumEntity,
	Lti11ToolConfigEntity,
	Oauth2ToolConfigEntity,
} from '@modules/tool/external-tool/entity';
import { FileRecordRefEmbeddable } from '@modules/tool/external-tool/entity/file-record-ref.embeddable';
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
			thumbnail: entity.thumbnail
				? new FileRecordRef({
						uploadUrl: entity.thumbnail.uploadUrl,
						fileRecordId: entity.thumbnail.fileRecord.id,
						fileName: entity.thumbnail.fileRecord.name,
				  })
				: undefined,
			config,
			parameters: this.mapCustomParametersToDOs(entity.parameters || []),
			isHidden: entity.isHidden,
			isDeactivated: entity.isDeactivated,
			openNewTab: entity.openNewTab,
			restrictToContexts: entity.restrictToContexts,
			medium: this.mapExternalToolMediumEntityToDO(entity.medium),
			createdAt: entity.createdAt,
		});
	}

	private static mapExternalToolMediumEntityToDO(entity?: ExternalToolMediumEntity): ExternalToolMedium | undefined {
		if (!entity) {
			return undefined;
		}

		return new ExternalToolMedium({
			mediumId: entity.mediumId,
			publisher: entity.publisher,
			mediaSourceId: entity.mediaSourceId,
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

	static mapDOToEntityProperties(domainObject: ExternalTool, em: EntityManager): ExternalToolEntityProps {
		let config: BasicToolConfigEntity | Oauth2ToolConfigEntity | Lti11ToolConfigEntity;
		switch (domainObject.config.type) {
			case ToolConfigType.BASIC:
				config = this.mapBasicToolConfigDOToEntity(domainObject.config as BasicToolConfig);
				break;
			case ToolConfigType.OAUTH2:
				config = this.mapOauth2ConfigDOToEntity(domainObject.config as Oauth2ToolConfig);
				break;
			case ToolConfigType.LTI11:
				config = this.mapLti11ToolConfigDOToEntity(domainObject.config as Lti11ToolConfig);
				break;
			default:
				/* istanbul ignore next */
				throw new UnprocessableEntityException(`Unknown config type.`);
		}

		return {
			id: domainObject.id,
			name: domainObject.name,
			description: domainObject.description,
			url: domainObject.url,
			logoUrl: domainObject.logoUrl,
			logoBase64: domainObject.logo,
			thumbnail: domainObject.thumbnail
				? new FileRecordRefEmbeddable({
						fileRecord: em.getReference(FileRecord, domainObject.thumbnail.fileRecordId),
						uploadUrl: domainObject.thumbnail.uploadUrl,
				  })
				: undefined,
			config,
			parameters: this.mapCustomParameterDOsToEntities(domainObject.parameters ?? []),
			isHidden: domainObject.isHidden,
			isDeactivated: domainObject.isDeactivated,
			openNewTab: domainObject.openNewTab,
			restrictToContexts: domainObject.restrictToContexts,
			medium: this.mapExternalToolMediumDOToEntity(domainObject.medium),
		};
	}

	private static mapExternalToolMediumDOToEntity(medium?: ExternalToolMedium): ExternalToolMediumEntity | undefined {
		if (!medium) {
			return undefined;
		}

		return new ExternalToolMediumEntity({
			mediumId: medium.mediumId,
			publisher: medium.publisher,
			mediaSourceId: medium.mediaSourceId,
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
