import { Test, TestingModule } from '@nestjs/testing';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	SortOrder,
	SortOrderMap,
	ToolConfigType,
} from '@shared/domain';
import { CustomParameterTypeParams } from '../interface/custom-parameter-type.enum';
import { CustomParameterCreateParams } from '../controller/dto/request/custom-parameter.params';
import { BasicToolConfigParams } from '../controller/dto/request/basic-tool-config.params';
import { Oauth2ToolConfigParams } from '../controller/dto/request/oauth2-tool-config.params';
import { ExternalToolParams } from '../controller/dto/request/external-tool-create.params';
import { ExternalToolRequestMapper } from './external-tool-request.mapper';
import { Lti11ToolConfigParams } from '../controller/dto/request/lti11-tool-config.params';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';
import { CustomParameterLocationParams } from '../interface/custom-parameter-location.enum';
import { CustomParameterScopeParams } from '../interface/custom-parameter-scope.enum';
import { LtiMessageType } from '../interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '../interface/lti-privacy-permission.enum';
import {
	ExternalToolSortOrder,
	SortExternalToolParams,
} from '@src/modules/tool/controller/dto/request/external-tool-sort.params';
import { ExternalToolSearchParams } from '@src/modules/tool/controller/dto/request/external-tool-search.params';

describe('ExternalToolRequestMapper', () => {
	let module: TestingModule;
	let mapper: ExternalToolRequestMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolRequestMapper],
		}).compile();

		mapper = module.get(ExternalToolRequestMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	function setup() {
		const basicConfigParams = new BasicToolConfigParams();
		basicConfigParams.type = ToolConfigType.BASIC;
		basicConfigParams.baseUrl = 'mockUrl';

		const customParameterCreateParams = new CustomParameterCreateParams();
		customParameterCreateParams.name = 'mockName';
		customParameterCreateParams.default = 'mockDefault';
		customParameterCreateParams.location = CustomParameterLocationParams.PATH;
		customParameterCreateParams.scope = CustomParameterScopeParams.SCHOOL;
		customParameterCreateParams.type = CustomParameterTypeParams.STRING;
		customParameterCreateParams.regex = 'mockRegex';

		const externalToolParams = new ExternalToolParams();
		externalToolParams.name = 'mockName';
		externalToolParams.url = 'mockUrl';
		externalToolParams.logoUrl = 'mockLogoUrl';
		externalToolParams.parameters = [customParameterCreateParams];
		externalToolParams.isHidden = true;
		externalToolParams.openNewTab = true;

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
		});
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
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
			externalToolParams,
			externalToolDO,
			basicToolConfigDO,
			basicConfigParams,
		};
	}

	describe('mapRequestToExternalToolDO', () => {
		describe('when mapping basic tool', () => {
			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolParams, externalToolDO, basicConfigParams } = setup();
				externalToolParams.config = basicConfigParams;

				const result = mapper.mapRequestToExternalToolDO(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});
		describe('when mapping lti tool', () => {
			function ltiSetup() {
				const lti11ConfigParams = new Lti11ToolConfigParams();
				lti11ConfigParams.type = ToolConfigType.LTI11;
				lti11ConfigParams.baseUrl = 'mockUrl';
				lti11ConfigParams.key = 'mockKey';
				lti11ConfigParams.secret = 'mockSecret';
				lti11ConfigParams.resource_link_id = 'mockLink';
				lti11ConfigParams.lti_message_type = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;
				lti11ConfigParams.privacy_permission = LtiPrivacyPermission.NAME;

				const lti11ToolConfigDO: Lti11ToolConfigDO = new Lti11ToolConfigDO({
					privacy_permission: LtiPrivacyPermission.NAME,
					secret: 'mockSecret',
					key: 'mockKey',
					resource_link_id: 'mockLink',
					lti_message_type: LtiMessageType.BASIC_LTI_LAUNCH_REQUEST,
					type: ToolConfigType.LTI11,
					baseUrl: 'mockUrl',
				});
				return { lti11ToolConfigDO, lti11ConfigParams };
			}
			it('should map the request to external tool DO with lti11 config', () => {
				const { lti11ToolConfigDO, lti11ConfigParams } = ltiSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = lti11ConfigParams;
				externalToolDO.config = lti11ToolConfigDO;

				const result = mapper.mapRequestToExternalToolDO(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});
		describe('when mapping oauth tool', () => {
			function oauthSetup() {
				const oauth2ConfigParams = new Oauth2ToolConfigParams();
				oauth2ConfigParams.type = ToolConfigType.OAUTH2;
				oauth2ConfigParams.baseUrl = 'mockUrl';
				oauth2ConfigParams.clientId = 'mockId';
				oauth2ConfigParams.clientSecret = 'mockSecret';
				oauth2ConfigParams.frontchannelLogoutUri = 'mockUrl';
				oauth2ConfigParams.skipConsent = true;
				oauth2ConfigParams.scope = 'mockScope';
				oauth2ConfigParams.redirectUris = ['mockUri'];
				oauth2ConfigParams.tokenEndpointAuthMethod = TokenEndpointAuthMethod.CLIENT_SECRET_POST;

				const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
					clientId: 'mockId',
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
					clientSecret: 'mockSecret',
					frontchannelLogoutUri: 'mockUrl',
					skipConsent: true,
					scope: 'mockScope',
					redirectUris: ['mockUri'],
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
				});

				return {
					oauth2ConfigParams,
					oauth2ToolConfigDO,
				};
			}

			it('should map the request to external tool DO with oauth2', () => {
				const { oauth2ConfigParams, oauth2ToolConfigDO } = oauthSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = oauth2ConfigParams;
				externalToolDO.config = oauth2ToolConfigDO;

				const result = mapper.mapRequestToExternalToolDO(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});

			it('should map DO to ProviderOauthClient', () => {
				const { oauth2ToolConfigDO } = oauthSetup();
				const { externalToolDO } = setup();
				externalToolDO.config = oauth2ToolConfigDO;
				externalToolDO.name = 'name';

				const result = mapper.mapDoToProviderOauthClient('name', oauth2ToolConfigDO);

				expect(result).toEqual({
					client_name: 'name',
					client_id: oauth2ToolConfigDO.clientId,
					client_secret: oauth2ToolConfigDO.clientSecret,
					scope: oauth2ToolConfigDO.scope,
					token_endpoint_auth_method: oauth2ToolConfigDO.tokenEndpointAuthMethod,
					redirect_uris: oauth2ToolConfigDO.redirectUris,
					frontchannel_logout_uri: oauth2ToolConfigDO.frontchannelLogoutUri,
					subject_type: 'pairwise',
				});
			});

			it('should apply the ProviderOauthClient to DO', () => {
				const { oauth2ConfigParams, oauth2ToolConfigDO } = oauthSetup();
				const { externalToolParams, externalToolDO } = setup();
				const oauthClient: ProviderOauthClient = {
					scope: '',
					token_endpoint_auth_method: TokenEndpointAuthMethod.PRIVATE_KEY_JWT,
					redirect_uris: [],
					frontchannel_logout_uri: '',
				};
				externalToolParams.config = oauth2ConfigParams;
				externalToolDO.config = oauth2ToolConfigDO;
				const expected: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
					type: oauth2ToolConfigDO.type,
					baseUrl: oauth2ToolConfigDO.baseUrl,
					clientId: oauth2ToolConfigDO.clientId,
					clientSecret: oauth2ToolConfigDO.clientSecret,
					skipConsent: oauth2ToolConfigDO.skipConsent,
					scope: oauthClient.scope,
					tokenEndpointAuthMethod: oauthClient.token_endpoint_auth_method as TokenEndpointAuthMethod,
					redirectUris: oauthClient.redirect_uris,
					frontchannelLogoutUri: oauthClient.frontchannel_logout_uri,
				});

				const result: Oauth2ToolConfigDO = mapper.applyProviderOauthClientToDO(oauth2ToolConfigDO, oauthClient);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('mapSortingQueryToDomain', () => {
		it('should map controller sorting query to domain sort order map', () => {
			const sortingQuery: SortExternalToolParams = {
				sortBy: ExternalToolSortOrder.ID,
				sortOrder: SortOrder.asc,
			};

			const result: SortOrderMap<ExternalToolDO> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

			expect(result).toEqual({ id: SortOrder.asc });
		});

		it('should map controller sorting query to undefined', () => {
			const sortingQuery: SortExternalToolParams = {
				sortOrder: SortOrder.asc,
			};

			const result: SortOrderMap<ExternalToolDO> | undefined = mapper.mapSortingQueryToDomain(sortingQuery);

			expect(result).toBeUndefined();
		});
	});

	describe('mapExternalToolFilterQueryToDO', () => {
		it('should map params to partial do', () => {
			const params: ExternalToolSearchParams = {
				name: 'name',
			};

			const doPartial = mapper.mapExternalToolFilterQueryToDO(params);

			expect(doPartial).toEqual(expect.objectContaining(params));
		});
	});
});
