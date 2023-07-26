import { DeepPartial } from 'fishery';
import { LtiPrivacyPermission } from '@shared/domain';
import { TokenEndpointAuthMethod } from '@src/modules/tool/common/interface';
import {
	BasicToolConfigDO,
	ExternalToolDO,
	ExternalToolProps,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
	ToolConfigType,
} from '@src/modules/tool/external-tool/domainobject';
import { CustomParameterDO } from '@src/modules/tool/external-tool/domainobject/custom-parameter.do';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
} from '@src/modules/tool/external-tool/entity';
import { DoBaseFactory } from '../do-base.factory';

export const basicToolConfigDOFactory = DoBaseFactory.define<BasicToolConfigDO, BasicToolConfigDO>(
	BasicToolConfigDO,
	() => {
		return {
			type: ToolConfigType.BASIC,
			baseUrl: 'https://www.basic-baseUrl.com/',
		};
	}
);

class Oauth2ToolConfigDOFactory extends DoBaseFactory<Oauth2ToolConfigDO, Oauth2ToolConfigDO> {
	withExternalData(oauth2Params?: DeepPartial<Oauth2ToolConfigDO>): this {
		const params: DeepPartial<Oauth2ToolConfigDO> = {
			clientSecret: 'clientSecret',
			scope: 'offline openid',
			frontchannelLogoutUri: 'https://www.frontchannel.com/',
			redirectUris: ['https://www.redirect.com/'],
			tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
		};

		return this.params({ ...params, ...oauth2Params });
	}
}

export const oauth2ToolConfigDOFactory = Oauth2ToolConfigDOFactory.define(Oauth2ToolConfigDO, () => {
	return {
		type: ToolConfigType.OAUTH2,
		baseUrl: 'https://www.oauth2-baseUrl.com/',
		clientId: 'clientId',
		skipConsent: false,
	};
});

export const lti11ToolConfigDOFactory = DoBaseFactory.define<Lti11ToolConfigDO, Lti11ToolConfigDO>(
	Lti11ToolConfigDO,
	() => {
		return {
			type: ToolConfigType.LTI11,
			baseUrl: 'https://www.lti11-baseUrl.com/',
			key: 'key',
			secret: 'secret',
			privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
			lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
			resource_link_id: 'linkId',
		};
	}
);

export const customParameterDOFactory = DoBaseFactory.define<CustomParameterDO, CustomParameterDO>(
	CustomParameterDO,
	({ sequence }) => {
		return {
			name: `custom-parameter-${sequence}`,
			displayName: 'User Friendly Name',
			type: CustomParameterType.STRING,
			scope: CustomParameterScope.GLOBAL,
			location: CustomParameterLocation.BODY,
			isOptional: false,
		};
	}
);

class ExternalToolDOFactory extends DoBaseFactory<ExternalToolDO, ExternalToolProps> {
	withOauth2Config(customParam?: DeepPartial<Oauth2ToolConfigDO>): this {
		const params: DeepPartial<ExternalToolDO> = {
			config: oauth2ToolConfigDOFactory.build(customParam),
		};
		return this.params(params);
	}

	withLti11Config(customParam?: DeepPartial<Lti11ToolConfigDO>): this {
		const params: DeepPartial<ExternalToolDO> = {
			config: lti11ToolConfigDOFactory.build(customParam),
		};
		return this.params(params);
	}

	withCustomParameters(number: number, customParam?: DeepPartial<CustomParameterDO>): this {
		const params: DeepPartial<ExternalToolDO> = {
			parameters: customParameterDOFactory.buildList(number, customParam),
		};
		return this.params(params);
	}
}

export const externalToolDOFactory = ExternalToolDOFactory.define(ExternalToolDO, ({ sequence }) => {
	return {
		name: `external-tool-${sequence}`,
		url: 'https://url.com/',
		config: basicToolConfigDOFactory.build(),
		logoUrl: 'https://logo.com/',
		isHidden: false,
		openNewTab: false,
		version: 1,
	};
});
