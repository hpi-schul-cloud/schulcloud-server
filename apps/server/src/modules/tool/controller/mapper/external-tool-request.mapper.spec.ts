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
	CustomParameterScopeTypeParams,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
} from '../../interface';
import {
	BasicToolConfigParams,
	CustomParameterPostParams,
	ExternalToolCreateParams,
	ExternalToolSearchParams,
	ExternalToolSortBy,
	ExternalToolUpdateParams,
	Lti11ToolConfigCreateParams,
	Oauth2ToolConfigCreateParams,
	SortExternalToolParams,
} from '../dto';
import { Lti11ToolConfigUpdateParams } from '../dto/request/config/lti11-tool-config-update.params';
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
		customParameterPostParams.scope = CustomParameterScopeTypeParams.SCHOOL;
		customParameterPostParams.type = CustomParameterTypeParams.STRING;
		customParameterPostParams.regex = 'mockRegex';
		customParameterPostParams.regexComment = 'mockComment';
		customParameterPostParams.isOptional = false;

		const externalToolCreateParams = new ExternalToolCreateParams();
		externalToolCreateParams.name = 'mockName';
		externalToolCreateParams.url = 'mockUrl';
		externalToolCreateParams.logoUrl = 'mockLogoUrl';
		externalToolCreateParams.parameters = [customParameterPostParams];
		externalToolCreateParams.isHidden = true;
		externalToolCreateParams.openNewTab = true;

		const externalToolUpdateParams = new ExternalToolUpdateParams();
		externalToolUpdateParams.id = 'id';
		externalToolUpdateParams.name = 'mockName';
		externalToolUpdateParams.url = 'mockUrl';
		externalToolUpdateParams.logoUrl = 'mockLogoUrl';
		externalToolUpdateParams.parameters = [customParameterPostParams];
		externalToolUpdateParams.isHidden = true;
		externalToolUpdateParams.openNewTab = true;

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

		const externalToolDOCreate: ExternalToolDO = new ExternalToolDO({
			name: 'mockName',
			url: 'mockUrl',
			logoUrl: 'mockLogoUrl',
			parameters: [customParameterDO],
			isHidden: true,
			openNewTab: true,
			version: 1,
			config: basicToolConfigDO,
		});

		const externalToolDOUpdate: ExternalToolDO = new ExternalToolDO({
			id: externalToolUpdateParams.id,
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
			externalToolCreateParams,
			externalToolUpdateParams,
			externalToolDOCreate,
			externalToolDOUpdate,
			basicToolConfigDO,
			basicConfigParams,
		};
	};

	describe('mapCreateRequest', () => {
		describe('when mapping basic tool', () => {
			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolCreateParams, externalToolDOCreate, basicConfigParams } = setup();
				externalToolCreateParams.config = basicConfigParams;

				const result = mapper.mapCreateRequest(externalToolCreateParams, 1);

				expect(result).toEqual(externalToolDOCreate);
			});
		});

		describe('when mapping lti tool', () => {
			const ltiSetup = () => {
				const lti11ConfigParams = new Lti11ToolConfigCreateParams();
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
				const { externalToolCreateParams, externalToolDOCreate } = setup();
				externalToolCreateParams.config = lti11ConfigParams;
				externalToolDOCreate.config = lti11ToolConfigDO;

				const result = mapper.mapCreateRequest(externalToolCreateParams, 1);

				expect(result).toEqual(externalToolDOCreate);
			});
		});

		describe('when mapping oauth tool', () => {
			const oauthSetup = () => {
				const oauth2ConfigParams = new Oauth2ToolConfigCreateParams();
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
				const { externalToolCreateParams, externalToolDOCreate } = setup();
				externalToolCreateParams.config = oauth2ConfigParams;
				externalToolDOCreate.config = oauth2ToolConfigDO;

				const result = mapper.mapCreateRequest(externalToolCreateParams, 1);

				expect(result).toEqual(externalToolDOCreate);
			});
		});
	});

	describe('mapUpdateRequest', () => {
		describe('when mapping basic tool', () => {
			it('should map the request to external tool DO with basicConfig', () => {
				const { externalToolUpdateParams, externalToolDOUpdate, basicConfigParams } = setup();
				externalToolUpdateParams.config = basicConfigParams;

				const result = mapper.mapUpdateRequest(externalToolUpdateParams, 1);

				expect(result).toEqual(externalToolDOUpdate);
			});
		});

		describe('when mapping lti tool', () => {
			const ltiSetup = () => {
				const lti11ConfigParams = new Lti11ToolConfigUpdateParams();
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
				const { externalToolUpdateParams, externalToolDOUpdate } = setup();
				externalToolUpdateParams.config = lti11ConfigParams;
				externalToolDOUpdate.config = lti11ToolConfigDO;

				const result = mapper.mapUpdateRequest(externalToolUpdateParams, 1);

				expect(result).toEqual(externalToolDOUpdate);
			});
		});

		describe('when mapping oauth tool', () => {
			const oauthSetup = () => {
				const oauth2ConfigParams = new Oauth2ToolConfigCreateParams();
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
				const { externalToolUpdateParams, externalToolDOUpdate } = setup();
				externalToolUpdateParams.config = oauth2ConfigParams;
				externalToolDOUpdate.config = oauth2ToolConfigDO;

				const result = mapper.mapUpdateRequest(externalToolUpdateParams, 1);

				expect(result).toEqual(externalToolDOUpdate);
			});
		});
	});

	describe('mapSortingQueryToDomain', () => {
		it('should map controller sorting query to domain sort order map', () => {
			const sortingQuery: SortExternalToolParams = {
				sortBy: ExternalToolSortBy.ID,
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
