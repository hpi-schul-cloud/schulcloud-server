import {
	basicToolConfigFactory,
	customParameterFactory,
	externalToolFactory,
	lti11ToolConfigFactory,
	oauth2ToolConfigFactory,
} from '@shared/testing';
import { CustomParameter } from '../../common/domain';
import {
	CustomParameterLocation,
	CustomParameterLocationParams,
	CustomParameterScope,
	CustomParameterScopeTypeParams,
	CustomParameterType,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '../../common/enum';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
} from '../controller/dto';
import { BasicToolConfig, ExternalTool, Lti11ToolConfig, Oauth2ToolConfig } from '../domain';
import { ExternalToolResponseMapper } from './external-tool-response.mapper';

describe('ExternalToolResponseMapper', () => {
	describe('mapToExternalToolResponse', () => {
		describe('when mapping basic tool DO', () => {
			const setup = () => {
				const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					defaultValue: 'mockDefault',
					location: CustomParameterLocationParams.PATH,
					scope: CustomParameterScopeTypeParams.SCHOOL,
					type: CustomParameterTypeParams.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
					isProtected: false,
				});

				const basicToolConfigResponse: BasicToolConfigResponse = new BasicToolConfigResponse({
					type: ToolConfigType.BASIC,
					baseUrl: 'mockUrl',
				});

				const basicToolConfig: BasicToolConfig = basicToolConfigFactory.build({
					type: ToolConfigType.BASIC,
					baseUrl: 'mockUrl',
				});

				const customParameter: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalTool: ExternalTool = externalToolFactory.build({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameter],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: basicToolConfig,
					isDeactivated: true,
				});

				const externalToolResponse: ExternalToolResponse = new ExternalToolResponse({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterResponse],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: basicToolConfigResponse,
					isDeactivated: true,
					description: externalTool.description,
				});

				return {
					externalToolResponse,
					externalTool,
				};
			};

			it('should map a basic tool do to a basic tool response', () => {
				const { externalTool, externalToolResponse } = setup();

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping oauth tool DO', () => {
			const setup = () => {
				const oauth2ToolConfigDO: Oauth2ToolConfig = oauth2ToolConfigFactory.build({
					clientId: 'mockId',
					skipConsent: false,
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
					scope: 'test',
					clientSecret: 'secret',
					frontchannelLogoutUri: 'http://logout',
					redirectUris: ['redirectUri'],
				});

				const oauth2ToolConfigResponse: Oauth2ToolConfigResponse = new Oauth2ToolConfigResponse({
					clientId: 'mockId',
					skipConsent: false,
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
					scope: 'test',
					frontchannelLogoutUri: 'http://logout',
					redirectUris: ['redirectUri'],
				});

				const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					defaultValue: 'mockDefault',
					location: CustomParameterLocationParams.PATH,
					scope: CustomParameterScopeTypeParams.SCHOOL,
					type: CustomParameterTypeParams.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
					isProtected: false,
				});

				const customParameter: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});

				const externalTool: ExternalTool = externalToolFactory.build({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameter],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: oauth2ToolConfigDO,
					isDeactivated: false,
				});

				const externalToolResponse: ExternalToolResponse = new ExternalToolResponse({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterResponse],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: oauth2ToolConfigResponse,
					isDeactivated: false,
					description: externalTool.description,
				});

				return {
					externalToolResponse,
					externalTool,
				};
			};

			it('should map a oauth2 tool do to a oauth2 tool response', () => {
				const { externalTool, externalToolResponse } = setup();

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping lti tool DO', () => {
			const setup = () => {
				const lti11ToolConfigDO: Lti11ToolConfig = lti11ToolConfigFactory.build({
					secret: 'mockSecret',
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					privacy_permission: LtiPrivacyPermission.NAME,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
					launch_presentation_locale: 'de-DE',
				});

				const lti11ToolConfigResponse: Lti11ToolConfigResponse = new Lti11ToolConfigResponse({
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					privacy_permission: LtiPrivacyPermission.NAME,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
					launch_presentation_locale: 'de-DE',
				});

				const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					defaultValue: 'mockDefault',
					location: CustomParameterLocationParams.PATH,
					scope: CustomParameterScopeTypeParams.SCHOOL,
					type: CustomParameterTypeParams.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
					isProtected: false,
				});

				const customParameter: CustomParameter = customParameterFactory.build({
					name: 'mockName',
					displayName: 'displayName',
					description: 'description',
					default: 'mockDefault',
					location: CustomParameterLocation.PATH,
					scope: CustomParameterScope.SCHOOL,
					type: CustomParameterType.STRING,
					regex: 'mockRegex',
					regexComment: 'mockComment',
					isOptional: false,
				});
				const externalTool: ExternalTool = externalToolFactory.build({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameter],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: lti11ToolConfigDO,
					isDeactivated: false,
				});

				const externalToolResponse: ExternalToolResponse = new ExternalToolResponse({
					id: '1',
					name: 'mockName',
					url: 'mockUrl',
					logoUrl: 'mockLogoUrl',
					parameters: [customParameterResponse],
					isHidden: true,
					openNewTab: true,
					version: 1,
					config: lti11ToolConfigResponse,
					isDeactivated: false,
					description: externalTool.description,
				});

				return {
					externalToolResponse,
					externalTool,
				};
			};

			it('should map an lti11 tool DO to an lti11 tool response', () => {
				const { externalTool, externalToolResponse } = setup();

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});
	});
});
