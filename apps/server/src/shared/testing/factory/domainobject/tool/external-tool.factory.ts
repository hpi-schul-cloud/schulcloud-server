import { CustomParameter } from '@src/modules/tool/common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '@src/modules/tool/common/enum';
import {
	BasicToolConfig,
	ExternalTool,
	ExternalToolProps,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '@src/modules/tool/external-tool/domain';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from '../do-base.factory';

export const basicToolConfigFactory = DoBaseFactory.define<BasicToolConfig, BasicToolConfig>(BasicToolConfig, () => {
	return {
		type: ToolConfigType.BASIC,
		baseUrl: 'https://www.basic-baseUrl.com/',
	};
});

class Oauth2ToolConfigFactory extends DoBaseFactory<Oauth2ToolConfig, Oauth2ToolConfig> {
	withExternalData(oauth2Params?: DeepPartial<Oauth2ToolConfig>): this {
		const params: DeepPartial<Oauth2ToolConfig> = {
			clientSecret: 'clientSecret',
			scope: 'offline openid',
			frontchannelLogoutUri: 'https://www.frontchannel.com/',
			redirectUris: ['https://www.redirect.com/'],
			tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
		};

		return this.params({ ...params, ...oauth2Params });
	}
}

export const oauth2ToolConfigFactory = Oauth2ToolConfigFactory.define(Oauth2ToolConfig, () => {
	return {
		type: ToolConfigType.OAUTH2,
		baseUrl: 'https://www.oauth2-baseUrl.com/',
		clientId: 'clientId',
		skipConsent: false,
	};
});

export const lti11ToolConfigFactory = DoBaseFactory.define<Lti11ToolConfig, Lti11ToolConfig>(Lti11ToolConfig, () => {
	return {
		type: ToolConfigType.LTI11,
		baseUrl: 'https://www.lti11-baseUrl.com/',
		key: 'key',
		secret: 'secret',
		privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
		lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
		resource_link_id: 'linkId',
	};
});

class CustomParameterFactory extends DoBaseFactory<CustomParameter, CustomParameter> {
	buildListWithEachType(params?: DeepPartial<CustomParameter>): CustomParameter[] {
		const globalParameter = this.build({ ...params, scope: CustomParameterScope.GLOBAL });
		const schoolParameter = this.build({ ...params, scope: CustomParameterScope.SCHOOL });
		const contextParameter = this.build({ ...params, scope: CustomParameterScope.CONTEXT });

		return [globalParameter, schoolParameter, contextParameter];
	}
}

export const customParameterFactory = CustomParameterFactory.define(CustomParameter, ({ sequence }) => {
	return {
		name: `custom-parameter-${sequence}`,
		displayName: 'User Friendly Name',
		type: CustomParameterType.STRING,
		scope: CustomParameterScope.GLOBAL,
		location: CustomParameterLocation.BODY,
		isOptional: false,
	};
});

class ExternalToolFactory extends DoBaseFactory<ExternalTool, ExternalToolProps> {
	withOauth2Config(customParam?: DeepPartial<BasicToolConfig>): this {
		const params: DeepPartial<ExternalTool> = {
			config: oauth2ToolConfigFactory.build(customParam),
		};
		return this.params(params);
	}

	withLti11Config(customParam?: DeepPartial<Lti11ToolConfig>): this {
		const params: DeepPartial<ExternalTool> = {
			config: lti11ToolConfigFactory.build(customParam),
		};
		return this.params(params);
	}

	withCustomParameters(number: number, customParam?: DeepPartial<CustomParameter>): this {
		const params: DeepPartial<ExternalTool> = {
			parameters: customParameterFactory.buildList(number, customParam),
		};
		return this.params(params);
	}
}

export const externalToolFactory = ExternalToolFactory.define(ExternalTool, ({ sequence }) => {
	return {
		name: `external-tool-${sequence}`,
		url: 'https://url.com/',
		config: basicToolConfigFactory.build(),
		logoUrl: 'https://logo.com/',
		isHidden: false,
		openNewTab: false,
		version: 1,
	};
});
