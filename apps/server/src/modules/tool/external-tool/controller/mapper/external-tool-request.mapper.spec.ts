import { Test, TestingModule } from '@nestjs/testing';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	SortOrder,
	SortOrderMap,
	ToolConfigType,
} from '@shared/domain';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/tool';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
} from '../../../interface';
import {
	BasicToolConfigParams,
	CustomParameterPostParams,
	ExternalToolPostParams,
	ExternalToolSearchParams,
	ExternalToolSortOrder,
	ExternalToolUpdateParams,
	Lti11ToolConfigParams,
	Oauth2ToolConfigParams,
	SortExternalToolParams,
} from '../../../controller/dto';
import { ExternalToolRequestMapper } from './external-tool-request.mapper';

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

	const setup = () => {
		const basicConfigParams = new BasicToolConfigParams();
		basicConfigParams.type = ToolConfigType.BASIC;
		basicConfigParams.baseUrl = 'mockUrl';

		const customParameterPostParams = new CustomParameterPostParams();
		customParameterPostParams.name = 'mockName';
		customParameterPostParams.displayName = 'displayName';
		customParameterPostParams.description = 'description';
		customParameterPostParams.defaultValue = 'mockDefault';
		customParameterPostParams.location = CustomParameterLocationParams.PATH;
		customParameterPostParams.scope = CustomParameterScopeParams.SCHOOL;
		customParameterPostParams.type = CustomParameterTypeParams.STRING;
		customParameterPostParams.regex = 'mockRegex';
		customParameterPostParams.regexComment = 'mockComment';
		customParameterPostParams.isOptional = false;

		const externalToolPostParams = new ExternalToolPostParams();
		externalToolPostParams.id = 'id';
		externalToolPostParams.name = 'mockName';
		externalToolPostParams.url = 'mockUrl';
		externalToolPostParams.logoUrl = 'mockLogoUrl';
		externalToolPostParams.parameters = [customParameterPostParams];
		externalToolPostParams.isHidden = true;
		externalToolPostParams.openNewTab = true;

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
		const externalToolDO: ExternalToolDO = new ExternalToolDO({
			id: externalToolPostParams.id,
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
			externalToolParams: externalToolPostParams,
			externalToolDO,
			basicToolConfigDO,
			basicConfigParams,
		};
	};

	describe('mapCreateRequest', () => {
		describe('when mapping basic tool', () => {
			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolParams, externalToolDO, basicConfigParams } = setup();
				externalToolParams.config = basicConfigParams;

				const result = mapper.mapCreateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when mapping lti tool', () => {
			const ltiSetup = () => {
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
			};

			it('should map the request to external tool DO with lti11 config', () => {
				const { lti11ToolConfigDO, lti11ConfigParams } = ltiSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = lti11ConfigParams;
				externalToolDO.config = lti11ToolConfigDO;

				const result = mapper.mapCreateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when mapping oauth tool', () => {
			const oauthSetup = () => {
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
			};

			it('should map the request to external tool DO with oauth2', () => {
				const { oauth2ConfigParams, oauth2ToolConfigDO } = oauthSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = oauth2ConfigParams;
				externalToolDO.config = oauth2ToolConfigDO;

				const result = mapper.mapCreateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});
	});

	describe('mapUpdateRequest', () => {
		describe('when mapping basic tool', () => {
			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolParams, externalToolDO, basicConfigParams } = setup();
				externalToolParams.config = basicConfigParams;

				const result = mapper.mapUpdateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});

			it('should update default config', () => {
				const { basicConfigParams } = setup();
				const params: ExternalToolUpdateParams = {
					openNewTab: undefined,
					isHidden: undefined,
					logoUrl: undefined,
					config: basicConfigParams,
					name: undefined,
					url: undefined,
					id: undefined,
					parameters: undefined,
				};

				const result: Partial<ExternalToolDO> = mapper.mapUpdateRequest(params, 1);

				expect(result).toEqual({
					config: {
						baseUrl: basicConfigParams.baseUrl,
						type: basicConfigParams.type,
					},
					createdAt: undefined,
					id: undefined,
					isHidden: true,
					logoUrl: undefined,
					parameters: [],
					updatedAt: undefined,
					name: '',
					openNewTab: true,
					url: undefined,
					version: 1,
				});
			});
		});

		describe('when mapping lti tool', () => {
			const ltiSetup = () => {
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
			};

			it('should map the request to external tool DO with lti11 config', () => {
				const { lti11ToolConfigDO, lti11ConfigParams } = ltiSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = lti11ConfigParams;
				externalToolDO.config = lti11ToolConfigDO;

				const result = mapper.mapUpdateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
			});
		});

		describe('when mapping oauth tool', () => {
			const oauthSetup = () => {
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
			};

			it('should map the request to external tool DO with oauth2', () => {
				const { oauth2ConfigParams, oauth2ToolConfigDO } = oauthSetup();
				const { externalToolParams, externalToolDO } = setup();
				externalToolParams.config = oauth2ConfigParams;
				externalToolDO.config = oauth2ToolConfigDO;

				const result = mapper.mapUpdateRequest(externalToolParams, 1);

				expect(result).toEqual(externalToolDO);
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
