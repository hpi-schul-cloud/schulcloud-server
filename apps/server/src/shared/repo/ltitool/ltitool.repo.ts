import { EntityName, NotFoundError } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { ILtiToolProperties, LtiPrivacyPermission, LtiTool } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { BaseDORepo } from '@shared/repo/base.do.repo';

@Injectable()
export class LtiToolRepo extends BaseDORepo<LtiToolDO, LtiTool, ILtiToolProperties> {
	get entityName(): EntityName<LtiTool> {
		return LtiTool;
	}

	entityFactory(props: ILtiToolProperties): LtiTool {
		return new LtiTool(props);
	}

	async findByName(name: string): Promise<LtiToolDO[]> {
		const entities: LtiTool[] = await this._em.find(LtiTool, { name });
		if (entities.length === 0) {
			throw new NotFoundError(`LtiTool with ${name} was not found.`);
		}
		const dos: LtiToolDO[] = entities.map((entity) => this.mapEntityToDO(entity));
		return dos;
	}

	async findByOauthClientId(oAuthClientId: string): Promise<LtiToolDO> {
		const entity = await this._em.findOneOrFail(LtiTool, { oAuthClientId });
		return this.mapEntityToDO(entity);
	}

	async findByClientIdAndIsLocal(oAuthClientId: string, isLocal: boolean): Promise<LtiToolDO | null> {
		const entity: LtiTool | null = await this._em.findOne(LtiTool, { oAuthClientId, isLocal });

		if (!entity) {
			return null;
		}

		const domainObject: LtiToolDO = this.mapEntityToDO(entity);

		return domainObject;
	}

	protected mapEntityToDO(entity: LtiTool): LtiToolDO {
		return new LtiToolDO({
			id: entity.id,
			name: entity.name,
			url: entity.url,
			key: entity.key,
			secret: entity.secret,
			logo_url: entity.logo_url,
			lti_message_type: entity.lti_message_type,
			lti_version: entity.lti_version,
			resource_link_id: entity.resource_link_id,
			roles: entity.roles || [],
			privacy_permission: entity.privacy_permission || LtiPrivacyPermission.ANONYMOUS,
			customs: entity.customs,
			isTemplate: entity.isTemplate,
			isLocal: entity.isLocal,
			originToolId: entity.originToolId,
			oAuthClientId: entity.oAuthClientId,
			friendlyUrl: entity.friendlyUrl,
			skipConsent: entity.skipConsent,
			openNewTab: entity.openNewTab,
			frontchannel_logout_uri: entity.frontchannel_logout_uri,
			isHidden: entity.isHidden,
		});
	}

	protected mapDOToEntityProperties(entityDO: LtiToolDO): ILtiToolProperties {
		return {
			name: entityDO.name,
			url: entityDO.url,
			key: entityDO.key,
			secret: entityDO.secret,
			logo_url: entityDO.logo_url,
			lti_message_type: entityDO.lti_message_type,
			lti_version: entityDO.lti_version,
			resource_link_id: entityDO.resource_link_id,
			roles: entityDO.roles,
			privacy_permission: entityDO.privacy_permission,
			customs: entityDO.customs,
			isTemplate: entityDO.isTemplate,
			isLocal: entityDO.isLocal,
			originToolId: entityDO.originToolId,
			oAuthClientId: entityDO.oAuthClientId,
			friendlyUrl: entityDO.friendlyUrl,
			skipConsent: entityDO.skipConsent,
			openNewTab: entityDO.openNewTab,
			frontchannel_logout_uri: entityDO.frontchannel_logout_uri,
			isHidden: entityDO.isHidden,
		};
	}
}
