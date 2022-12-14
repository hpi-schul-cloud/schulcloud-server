import { Test, TestingModule } from '@nestjs/testing';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { ExternalToolResponseMapper } from './external-tool-response.mapper';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '../../interface';
import {
	BasicToolConfigResponse,
	CustomParameterResponse,
	ExternalToolResponse,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigResponse,
} from '../dto';

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
			default: 'mockDefault',
			location: CustomParameterLocationParams.PATH,
			scope: CustomParameterScopeParams.SCHOOL,
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
			default: 'mockDefault',
			location: CustomParameterLocation.PATH,
			scope: CustomParameterScope.SCHOOL,
			type: CustomParameterType.STRING,
			regex: 'mockRegex',
			regexComment: 'mockComment',
			isOptional: false,
		});
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
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

				const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

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

				const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

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

				const result: ExternalToolResponse = mapper.mapToResponse(externalToolDO);

				expect(result).toEqual(externalToolResponse);
			});
		});
	});
});
