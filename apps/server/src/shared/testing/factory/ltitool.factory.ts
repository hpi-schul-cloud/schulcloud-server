import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ILtiToolProperties, LTI_PRIVACY_PERMISSION, LTI_ROLE_TYPE, LtiTool } from '@shared/domain/index';
import { DeepPartial } from 'fishery';

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

	withLocal(isLocal: boolean): this {
		const params: DeepPartial<ILtiToolProperties> = {
			isLocal,
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
		customs: [{ test: 'test' }],
		isHidden: false,
		isTemplate: false,
		key: 'key',
		openNewTab: false,
		originToolId: 'originToolId',
		privacy_permission: LTI_PRIVACY_PERMISSION.NAME,
		roles: [LTI_ROLE_TYPE.INSTRUCTOR, LTI_ROLE_TYPE.LEARNER],
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
