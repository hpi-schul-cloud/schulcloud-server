import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { DeepPartial } from 'fishery';
import { CustomParameter } from '../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '../../common/enum';
import {
	BasicToolConfig,
	ExternalTool,
	ExternalToolMedium,
	ExternalToolProps,
	Lti11ToolConfig,
	Oauth2ToolConfig,
} from '../domain';
import { base64TestLogo } from './base64-test-logo';
import { externalToolMediumFactory } from './external-tool-medium.factory';
import { fileRecordRefFactory } from './file-record-ref.factory';

export const basicToolConfigFactory = DoBaseFactory.define<BasicToolConfig, BasicToolConfig>(BasicToolConfig, () => {
	return {
		type: ToolConfigType.BASIC,
		baseUrl: 'https://www.basic-baseurl.com/',
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
		baseUrl: 'https://www.oauth2-baseurl.com/',
		clientId: 'clientId',
		skipConsent: false,
	};
});

export const lti11ToolConfigFactory = DoBaseFactory.define<Lti11ToolConfig, Lti11ToolConfig>(Lti11ToolConfig, () => {
	return {
		type: ToolConfigType.LTI11,
		baseUrl: 'https://www.lti11-baseurl.com/',
		key: 'key',
		secret: 'secret',
		privacy_permission: LtiPrivacyPermission.PSEUDONYMOUS,
		lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
		launch_presentation_locale: 'de-DE',
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
		scope: CustomParameterScope.SCHOOL,
		location: CustomParameterLocation.BODY,
		isOptional: false,
		isProtected: false,
	};
});

class ExternalToolFactory extends DoBaseFactory<ExternalTool, ExternalToolProps> {
	public withBasicConfig(customParam?: DeepPartial<BasicToolConfig>): this {
		const params: DeepPartial<ExternalTool> = {
			config: basicToolConfigFactory.build(customParam),
		};

		return this.params(params);
	}

	public withOauth2Config(customParam?: DeepPartial<Oauth2ToolConfig>): this {
		const params: DeepPartial<ExternalTool> = {
			config: oauth2ToolConfigFactory.build(customParam),
		};

		return this.params(params);
	}

	public withLti11Config(customParam?: DeepPartial<Lti11ToolConfig>): this {
		const params: DeepPartial<ExternalTool> = {
			config: lti11ToolConfigFactory.build(customParam),
		};

		return this.params(params);
	}

	public withCustomParameters(number: number, customParam?: DeepPartial<CustomParameter>): this {
		const params: DeepPartial<ExternalTool> = {
			parameters: customParameterFactory.buildList(number, customParam),
		};

		return this.params(params);
	}

	public withBase64Logo(): this {
		const params: DeepPartial<ExternalTool> = {
			logo: `data:image/png;base64,${base64TestLogo}`,
		};

		return this.params(params);
	}

	public withMedium(props?: DeepPartial<ExternalToolMedium>): this {
		const params: DeepPartial<ExternalTool> = {
			medium: externalToolMediumFactory.build(props),
		};

		return this.params(params);
	}

	public withFileRecordRef(): this {
		const params: DeepPartial<ExternalTool> = {
			thumbnail: fileRecordRefFactory.build(),
		};

		return this.params(params);
	}
}

export const externalToolFactory = ExternalToolFactory.define(ExternalTool, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `external-tool-${sequence}`,
		description: 'description',
		url: 'https://url.com/',
		config: basicToolConfigFactory.build(),
		logoUrl: 'https://logo.com/',
		isHidden: false,
		isDeactivated: false,
		openNewTab: false,
		createdAt: new Date(2020, 1, 1),
		restrictToContexts: undefined,
		isPreferred: false,
		iconName: undefined,
	};
});
