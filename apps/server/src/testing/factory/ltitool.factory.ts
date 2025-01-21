import { CustomLtiPropertyDO } from '@shared/domain/domainobject/ltitool.do';
import { ILtiToolProperties, LtiPrivacyPermission, LtiRoleType, LtiTool } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class LtiToolFactory extends BaseFactory<LtiTool, ILtiToolProperties> {
	withName(name: string): this {
		const params: DeepPartial<ILtiToolProperties> = {
			name,
		};
		return this.params(params);
	}

	withOauthClientId(oAuthClientId: string): this {
		const params: DeepPartial<ILtiToolProperties> = {
			oAuthClientId,
		};
		return this.params(params);
	}
}

export const ltiToolFactory = LtiToolFactory.define(LtiTool, ({ sequence }) => {
	return {
		name: `ltiTool-${sequence}`,
		isLocal: true,
		oAuthClientId: 'clientId',
		secret: 'secret',
		customs: [new CustomLtiPropertyDO('key', 'value')],
		isHidden: false,
		isTemplate: false,
		key: 'key',
		openNewTab: false,
		originToolId: 'originToolId',
		privacy_permission: LtiPrivacyPermission.NAME,
		roles: [LtiRoleType.INSTRUCTOR, LtiRoleType.LEARNER],
		url: 'url',
		friendlyUrl: 'friendlyUrl',
		frontchannel_logout_uri: 'frontchannel_logout_uri',
		logo_url: 'logo_url',
		lti_message_type: 'lti_message_type',
		lti_version: 'lti_version',
		resource_link_id: 'resource_link_id',
		skipConsent: true,
	};
});
