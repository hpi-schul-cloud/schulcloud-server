import { Test, TestingModule } from '@nestjs/testing';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
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
import { ExternalToolResponseMapper } from './external-tool-response.mapper';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolConfigurationTemplateResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
	ToolConfigurationEntryResponse,
	ToolConfigurationListResponse,
} from '../controller/dto';
import { BasicToolConfigDO, ExternalTool, Lti11ToolConfigDO, Oauth2ToolConfigDO } from '../domain';
import { CustomParameterDO } from '../../common/domain';

describe('ExternalToolResponseMapper', () => {
	let module: TestingModule;
	let mapper: ExternalToolResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolResponseMapper],
		}).compile();

		mapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

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

		const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
			type: ToolConfigType.BASIC,
			baseUrl: 'mockUrl',
		});

		const customParameterDO: CustomParameterDO = new CustomParameterDO({
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
		const externalToolDO: ExternalTool = new ExternalTool({
			id: '1',
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameterDO],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfigDO,
		});

		return {
			externalToolResponse,
			externalToolDO,
			basicToolConfigDO,
			basicToolConfigResponse,
		};
	};

	describe('mapToResponse', () => {
		describe('when mapping basic tool DO', () => {
			it('should map a basic tool do to a basic tool response', () => {
				const { externalToolDO, externalToolResponse, basicToolConfigDO, basicToolConfigResponse } = setup();
				externalToolDO.config = basicToolConfigDO;
				externalToolResponse.config = basicToolConfigResponse;

				const result: ExternalToolResponse = mapper.mapToExternalToolResponse(externalToolDO);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping oauth tool DO', () => {
			const oauthSetup = () => {
				const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
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
				const { externalToolDO, externalToolResponse } = setup();
				externalToolDO.config = oauth2ToolConfigDO;
				externalToolResponse.config = oauth2ToolConfigResponse;

				const result: ExternalToolResponse = mapper.mapToExternalToolResponse(externalToolDO);

				expect(result).toEqual(externalToolResponse);
			});
		});

		describe('when mapping lti tool DO', () => {
			const ltiSetup = () => {
				const lti11ToolConfigDO: Lti11ToolConfigDO = new Lti11ToolConfigDO({
					secret: 'mockSecret',
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					privacy_permission: LtiPrivacyPermission.NAME,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
				});

				const lti11ToolConfigResponse: Lti11ToolConfigResponse = new Lti11ToolConfigResponse({
					key: 'mockKey',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					privacy_permission: LtiPrivacyPermission.NAME,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
				});

				return { lti11ToolConfigDO, lti11ToolConfigResponse };
			};
			it('should map a lti11 tool DO to a lti11 tool response', () => {
				const { lti11ToolConfigDO, lti11ToolConfigResponse } = ltiSetup();
				const { externalToolDO, externalToolResponse } = setup();
				externalToolDO.config = lti11ToolConfigDO;
				externalToolResponse.config = lti11ToolConfigResponse;

				const result: ExternalToolResponse = mapper.mapToExternalToolResponse(externalToolDO);

				expect(result).toEqual(externalToolResponse);
			});
		});
	});

	describe('mapExternalToolDOsToToolConfigurationListResponse is called', () => {
		describe('when mapping from ExternalToolDOs to ToolConfigurationListResponse', () => {
			it('should map from ExternalToolDOs to ToolConfigurationListResponse', () => {
				const externalToolDOs: ExternalTool[] = externalToolDOFactory.buildList(3, {
					id: 'toolId',
					name: 'toolName',
					logoUrl: 'logoUrl',
				});
				const expectedResponse: ToolConfigurationEntryResponse = new ToolConfigurationEntryResponse({
					id: 'toolId',
					name: 'toolName',
					logoUrl: 'logoUrl',
				});

				const result: ToolConfigurationListResponse =
					mapper.mapExternalToolDOsToToolConfigurationListResponse(externalToolDOs);

				expect(result.data).toEqual(expect.arrayContaining([expectedResponse, expectedResponse, expectedResponse]));
			});
		});
	});

	describe('mapToConfigurationTemplateResponse is called', () => {
		describe('when  ExternalToolDO is given', () => {
			it('should map ExternalToolDO to ExternalToolConfigurationTemplateResponse', () => {
				const externalToolDO: ExternalTool = externalToolDOFactory
					.withCustomParameters(1, {
						displayName: 'displayName',
						description: 'description',
						scope: CustomParameterScope.SCHOOL,
						type: CustomParameterType.STRING,
						location: CustomParameterLocation.PATH,
						name: 'customParameter',
						isOptional: false,
						default: 'defaultValue',
					})
					.buildWithId(
						{
							name: 'toolName',
							logoUrl: 'logoUrl',
							version: 1,
						},
						'toolId'
					);
				const expected: ExternalToolConfigurationTemplateResponse = new ExternalToolConfigurationTemplateResponse({
					id: 'toolId',
					name: 'toolName',
					logoUrl: 'logoUrl',
					parameters: [
						new CustomParameterResponse({
							scope: CustomParameterScopeTypeParams.SCHOOL,
							type: CustomParameterTypeParams.STRING,
							location: CustomParameterLocationParams.PATH,
							name: 'customParameter',
							displayName: 'displayName',
							description: 'description',
							isOptional: false,
							defaultValue: 'defaultValue',
						}),
					],
					version: 1,
				});

				const result: ExternalToolConfigurationTemplateResponse =
					mapper.mapToConfigurationTemplateResponse(externalToolDO);

				expect(result).toEqual(expected);
			});
		});
	});
});
