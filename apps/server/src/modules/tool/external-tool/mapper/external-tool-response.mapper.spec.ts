import {
	basicToolConfigFactory,
	customParameterFactory,
	externalToolFactory,
	lti11ToolConfigFactory,
	oauth2ToolConfigFactory,
} from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { CustomParameter } from '../../common/domain/custom-parameter.do';
import { CustomParameterLocation } from '../../common/enum/custom-parameter-location.enum';
import { CustomParameterScope } from '../../common/enum/custom-parameter-scope.enum';
import { CustomParameterType } from '../../common/enum/custom-parameter-type.enum';
import { LtiMessageType } from '../../common/enum/lti-message-type.enum';
import { LtiPrivacyPermission } from '../../common/enum/lti-privacy-permission.enum';
import { CustomParameterLocationParams } from '../../common/enum/request-response/custom-parameter-location.enum';
import { CustomParameterScopeTypeParams } from '../../common/enum/request-response/custom-parameter-scope-type.enum';
import { CustomParameterTypeParams } from '../../common/enum/request-response/custom-parameter-type.enum';
import { TokenEndpointAuthMethod } from '../../common/enum/token-endpoint-auth-method.enum';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { BasicToolConfigResponse } from '../controller/dto/response/config/basic-tool-config.response';
import { Lti11ToolConfigResponse } from '../controller/dto/response/config/lti11-tool-config.response';
import { Oauth2ToolConfigResponse } from '../controller/dto/response/config/oauth2-tool-config.response';
import { CustomParameterResponse } from '../controller/dto/response/custom-parameter.response';
import { ExternalToolResponse } from '../controller/dto/response/external-tool.response';
import { BasicToolConfig } from '../domain/config/basic-tool-config.do';
import { Lti11ToolConfig } from '../domain/config/lti11-tool-config.do';
import { Oauth2ToolConfig } from '../domain/config/oauth2-tool-config.do';
import { ExternalTool } from '../domain/external-tool.do';
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
					resource_link_id: 'linkId',
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
