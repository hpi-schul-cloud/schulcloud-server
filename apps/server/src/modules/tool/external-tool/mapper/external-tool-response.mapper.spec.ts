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
		});
		const basicToolConfigResponse: BasicToolConfigResponse = new BasicToolConfigResponse({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
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
		});

		const basicToolConfig: BasicToolConfig = new BasicToolConfig({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});

		const customParameter: CustomParameter = new CustomParameter({
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
		const externalTool: ExternalTool = new ExternalTool({
			id: '1',
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameter],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfig,
		});

		return {
			externalToolResponse,
			externalTool,
			basicToolConfig,
			basicToolConfigResponse,
		};
	};

	describe('mapToExternalToolResponse', () => {
		describe('when mapping basic tool DO', () => {
			it('should map a basic tool do to a basic tool response', () => {
				const { externalTool, externalToolResponse, basicToolConfig, basicToolConfigResponse } = setup();
				externalTool.config = basicToolConfig;
				externalToolResponse.config = basicToolConfigResponse;

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping oauth tool DO', () => {
			const oauthSetup = () => {
				const oauth2ToolConfigDO: Oauth2ToolConfig = new Oauth2ToolConfig({
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

				return {
					oauth2ToolConfigResponse,
					oauth2ToolConfigDO,
				};
			};

			it('should map a oauth2 tool do to a oauth2 tool response', () => {
				const { oauth2ToolConfigDO, oauth2ToolConfigResponse } = oauthSetup();
				const { externalTool, externalToolResponse } = setup();
				externalTool.config = oauth2ToolConfigDO;
				externalToolResponse.config = oauth2ToolConfigResponse;

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping lti tool DO', () => {
			const ltiSetup = () => {
				const lti11ToolConfigDO: Lti11ToolConfig = new Lti11ToolConfig({
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

				return { lti11ToolConfigDO, lti11ToolConfigResponse };
			};
			it('should map a lti11 tool DO to a lti11 tool response', () => {
				const { lti11ToolConfigDO, lti11ToolConfigResponse } = ltiSetup();
				const { externalTool, externalToolResponse } = setup();
				externalTool.config = lti11ToolConfigDO;
				externalToolResponse.config = lti11ToolConfigResponse;

				const result: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

				expect(result).toEqual(externalToolResponse);
			});
		});
	});
});
