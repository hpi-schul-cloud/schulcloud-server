import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Authorization } from 'oauth-1.0a';
import {
	CustomParameterLocation,
	CustomParameterScope,
	CustomParameterType,
	ICurrentUser,
	IFindOptions,
	SortOrder,
} from '@shared/domain';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { PaginationParams } from '@shared/controller';
import {
	ExternalToolSortOrder,
	SortExternalToolParams,
} from '@src/modules/tool/controller/dto/request/external-tool-sort.params';
import { ExternalToolSearchParams } from '@src/modules/tool/controller/dto/request/external-tool-search.params';
import { Page } from '@shared/domain/interface/page';
import { ExternalToolSearchListResponse } from '@src/modules/tool/controller/dto/response/external-tool-search-list.response';
import { ToolController } from './tool.controller';
import { Lti11Uc } from '../uc/lti11.uc';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { ExternalToolUc } from '../uc/external-tool.uc';
import { ExternalToolRequestMapper } from '../mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from '../mapper/external-tool-response.mapper';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { BasicToolConfigParams } from './dto/request/basic-tool-config.params';
import { CustomParameterTypeParams } from '../interface/custom-parameter-type.enum';
import { ExternalToolResponse } from './dto/response/external-tool.response';
import { CustomParameterCreateParams } from './dto/request/custom-parameter.params';
import { ExternalToolCreateParams } from './dto/request/external-tool-create.params';
import { BasicToolConfigResponse } from './dto/response/basic-tool-config.response';
import { Lti11ToolConfigParams } from './dto/request/lti11-tool-config.params';
import { CustomParameterLocationParams } from '../interface/custom-parameter-location.enum';
import { Oauth2ToolConfigResponse } from './dto/response/oauth2-tool-config.response';
import { CustomParameterScopeParams } from '../interface/custom-parameter-scope.enum';
import { Oauth2ToolConfigParams } from './dto/request/oauth2-tool-config.params';
import { CustomParameterResponse } from './dto/response/custom-parameter.response';
import { Lti11ToolConfigResponse } from './dto/response/lti11-tool-config.response';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';
import { ToolConfigType } from '../interface/tool-config-type.enum';
import { LtiMessageType } from '../interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '../interface/lti-privacy-permission.enum';
import { ExternalToolUpdateParams } from './dto/request/external-tool-update.params';

describe('ToolController', () => {
	let module: TestingModule;
	let controller: ToolController;

	let lti11Uc: DeepMocked<Lti11Uc>;
	let lti11ResponseMapper: DeepMocked<Lti11ResponseMapper>;

	let externalToolUc: DeepMocked<ExternalToolUc>;
	let externalToolMapper: DeepMocked<ExternalToolRequestMapper>;
	let externalToolResponseMapper: DeepMocked<ExternalToolResponseMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolController,
				{
					provide: Lti11Uc,
					useValue: createMock<Lti11Uc>(),
				},
				{
					provide: Lti11ResponseMapper,
					useValue: createMock<Lti11ResponseMapper>(),
				},
				{
					provide: ExternalToolUc,
					useValue: createMock<ExternalToolUc>(),
				},
				{
					provide: ExternalToolRequestMapper,
					useValue: createMock<ExternalToolRequestMapper>(),
				},
				{
					provide: ExternalToolResponseMapper,
					useValue: createMock<ExternalToolResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(ToolController);
		lti11Uc = module.get(Lti11Uc);
		lti11ResponseMapper = module.get(Lti11ResponseMapper);
		externalToolUc = module.get(ExternalToolUc);
		externalToolMapper = module.get(ExternalToolRequestMapper);
		externalToolResponseMapper = module.get(ExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLti11LaunchParameters', () => {
		it('should fetch the authorized launch parameters and return the response', async () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const toolId = 'toolId';
			const courseId = 'courseId';
			const authorization: Authorization = {
				oauth_consumer_key: 'key',
				oauth_nonce: 'nonce',
				oauth_body_hash: 'body_hash',
				oauth_signature: 'signature',
				oauth_timestamp: 100,
				oauth_token: 'token',
				oauth_version: 'version',
				oauth_signature_method: 'signature_method',
			};

			lti11Uc.getLaunchParameters.mockResolvedValue(authorization);
			lti11ResponseMapper.mapAuthorizationToResponse.mockReturnValue(new Lti11LaunchResponse(authorization));

			const result: Lti11LaunchResponse = await controller.getLti11LaunchParameters(
				currentUser,
				{ toolId },
				{ courseId }
			);

			expect(result).toEqual(expect.objectContaining(authorization));
			expect(lti11Uc.getLaunchParameters).toHaveBeenCalledWith(currentUser, toolId, courseId);
		});
	});

	describe('createExternalTool', () => {
		function setup() {
			const customParameterCreateParams = new CustomParameterCreateParams();
			customParameterCreateParams.name = 'mockName';
			customParameterCreateParams.default = 'mockDefault';
			customParameterCreateParams.location = CustomParameterLocationParams.PATH;
			customParameterCreateParams.scope = CustomParameterScopeParams.SCHOOL;
			customParameterCreateParams.type = CustomParameterTypeParams.STRING;
			customParameterCreateParams.regex = 'mockRegex';

			const body = new ExternalToolCreateParams();
			body.name = 'mockName';
			body.url = 'mockUrl';
			body.logoUrl = 'mockLogoUrl';
			body.parameters = [customParameterCreateParams];
			body.isHidden = true;
			body.openNewTab = true;

			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

			const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
				name: 'mockName',
				default: 'mockDefault',
				location: CustomParameterLocationParams.PATH,
				scope: CustomParameterScopeParams.SCHOOL,
				type: CustomParameterTypeParams.STRING,
				regex: 'mockRegex',
			});

			const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockUrl',
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

			const customParameterDO: CustomParameterDO = new CustomParameterDO({
				name: 'mockName',
				default: 'mockDefault',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
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
				body,
				currentUser,
				externalToolResponse,
				externalToolDO,
			};
		}

		describe('when creating an oauthTool', () => {
			function oauthSetup() {
				const bodyConfigCreateOauthParams = new Oauth2ToolConfigParams();
				bodyConfigCreateOauthParams.type = ToolConfigType.OAUTH2;
				bodyConfigCreateOauthParams.baseUrl = 'mockUrl';
				bodyConfigCreateOauthParams.clientId = 'mockId';
				bodyConfigCreateOauthParams.clientSecret = 'mockSecret';
				bodyConfigCreateOauthParams.frontchannelLogoutUri = 'mockUrl';
				bodyConfigCreateOauthParams.skipConsent = true;
				bodyConfigCreateOauthParams.scope = 'mockScope';
				bodyConfigCreateOauthParams.redirectUris = ['mockUri'];
				bodyConfigCreateOauthParams.tokenEndpointAuthMethod = TokenEndpointAuthMethod.CLIENT_SECRET_POST;

				const oauth2ToolConfigResponse: Oauth2ToolConfigResponse = new Oauth2ToolConfigResponse({
					clientId: 'mockId',
					skipConsent: false,
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
				});

				const oauth2ToolConfigDO: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
					clientId: 'mockId',
					skipConsent: false,
					type: ToolConfigType.OAUTH2,
					baseUrl: 'mockUrl',
				});

				return {
					bodyConfigCreateOauthParams,
					oauth2ToolConfigResponse,
					oauth2ToolConfigDO,
				};
			}

			it('should return external tool response with oauth2 config', async () => {
				const { body, currentUser, externalToolResponse, externalToolDO } = setup();
				const { bodyConfigCreateOauthParams, oauth2ToolConfigResponse, oauth2ToolConfigDO } = oauthSetup();
				body.config = bodyConfigCreateOauthParams;
				externalToolResponse.config = oauth2ToolConfigResponse;
				externalToolDO.config = oauth2ToolConfigDO;

				externalToolMapper.mapCreateRequestToExternalToolDO.mockReturnValue(externalToolDO);
				externalToolUc.createExternalTool.mockResolvedValue(externalToolDO);
				externalToolResponseMapper.mapToResponse.mockReturnValue(externalToolResponse);

				const expected = await controller.createExternalTool(body, currentUser);

				expect(expected).toEqual(externalToolResponse);
			});
		});

		describe('when creating an basic tool', () => {
			function basicSetup() {
				const bodyConfigCreateBasicParams = new BasicToolConfigParams();
				bodyConfigCreateBasicParams.type = ToolConfigType.BASIC;
				bodyConfigCreateBasicParams.baseUrl = 'mockUrl';

				return {
					bodyConfigCreateBasicParams,
				};
			}

			it('should return basic external tool response', async () => {
				const { body, currentUser, externalToolResponse, externalToolDO } = setup();
				const { bodyConfigCreateBasicParams } = basicSetup();
				body.config = bodyConfigCreateBasicParams;

				externalToolMapper.mapCreateRequestToExternalToolDO.mockReturnValue(externalToolDO);
				externalToolUc.createExternalTool.mockResolvedValue(externalToolDO);
				externalToolResponseMapper.mapToResponse.mockReturnValue(externalToolResponse);

				const expected = await controller.createExternalTool(body, currentUser);

				expect(expected).toEqual(externalToolResponse);
			});
		});

		describe('when creating an lti tool', () => {
			function ltiSetup() {
				const bodyConfigCreateLti11Params = new Lti11ToolConfigParams();
				bodyConfigCreateLti11Params.type = ToolConfigType.LTI11;
				bodyConfigCreateLti11Params.baseUrl = 'mockUrl';
				bodyConfigCreateLti11Params.key = 'mockKey';
				bodyConfigCreateLti11Params.secret = 'mockSecret';
				bodyConfigCreateLti11Params.resource_link_id = 'mockLink';
				bodyConfigCreateLti11Params.lti_message_type = LtiMessageType.BASIC_LTI_LAUNCH_REQUEST;

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

				return {
					bodyConfigCreateLti11Params,
					lti11ToolConfigDO,
					lti11ToolConfigResponse,
				};
			}
			it('should return external tool response with lti config', async () => {
				const { body, currentUser, externalToolResponse, externalToolDO } = setup();
				const { bodyConfigCreateLti11Params, lti11ToolConfigResponse, lti11ToolConfigDO } = ltiSetup();
				body.config = bodyConfigCreateLti11Params;
				externalToolResponse.config = lti11ToolConfigResponse;
				externalToolDO.config = lti11ToolConfigDO;

				externalToolMapper.mapCreateRequestToExternalToolDO.mockReturnValue(externalToolDO);
				externalToolUc.createExternalTool.mockResolvedValue(externalToolDO);
				externalToolResponseMapper.mapToResponse.mockReturnValue(externalToolResponse);

				const expected = await controller.createExternalTool(body, currentUser);

				expect(expected).toEqual(externalToolResponse);
			});
		});
	});

	describe('findExternalTool', () => {
		function setupFind() {
			const filterQuery: ExternalToolSearchParams = new ExternalToolSearchParams();
			const pagination: PaginationParams = { skip: 0, limit: 1 };
			const sortingQuery: SortExternalToolParams = { sortOrder: SortOrder.asc, sortBy: ExternalToolSortOrder.NAME };
			const filter: IFindOptions<ExternalToolDO> = {
				pagination: { skip: 0, limit: 1 },
				order: { name: SortOrder.asc },
			};
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const externalToolDO: ExternalToolDO = new ExternalToolDO({
				id: '1',
				name: 'mockName',
				url: 'mockUrl',
				logoUrl: 'mockLogoUrl',
				parameters: [],
				isHidden: true,
				openNewTab: true,
				version: 1,
				config: new Oauth2ToolConfigDO({} as Oauth2ToolConfigDO),
			});
			const externalToolResponse: ExternalToolResponse = new ExternalToolResponse({
				id: '1',
				name: externalToolDO.name,
				url: externalToolDO.url,
				logoUrl: externalToolDO.logoUrl,
				parameters: [],
				isHidden: true,
				openNewTab: true,
				version: 1,
				config: new Oauth2ToolConfigResponse({} as Oauth2ToolConfigResponse),
			});

			externalToolMapper.mapSortingQueryToDomain.mockReturnValue(filter.order);
			externalToolMapper.mapExternalToolFilterQueryToDO.mockReturnValue({});
			externalToolUc.findExternalTool.mockResolvedValue(new Page<ExternalToolDO>([externalToolDO], 1));
			externalToolResponseMapper.mapToResponse.mockReturnValue(externalToolResponse);

			return {
				currentUser,
				externalToolDO,
				externalToolResponse,
				filterQuery,
				pagination,
				sortingQuery,
				filter,
			};
		}

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should call the externalToolUc', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, filter } = setupFind();

			await controller.findExternalTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(externalToolUc.findExternalTool).toHaveBeenCalledWith(currentUser.userId, {}, filter);
		});

		it('should call the externalToolMapper.mapSortingQueryToDomain', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery } = setupFind();

			await controller.findExternalTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(externalToolMapper.mapSortingQueryToDomain).toHaveBeenCalledWith(sortingQuery);
		});

		it('should call the externalToolMapper.mapExternalToolFilterQueryToDO', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery } = setupFind();

			await controller.findExternalTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(externalToolMapper.mapExternalToolFilterQueryToDO).toHaveBeenCalledWith(filterQuery);
		});

		it('should call the externalToolResponseMapper.mapToResponse', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, externalToolDO } = setupFind();

			await controller.findExternalTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(externalToolResponseMapper.mapToResponse).toHaveBeenCalledWith(externalToolDO);
		});

		it('should return a externalToolSearchListResponse', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, externalToolResponse } = setupFind();

			const result: ExternalToolSearchListResponse = await controller.findExternalTool(
				currentUser,
				filterQuery,
				pagination,
				sortingQuery
			);

			expect(result).toEqual(new ExternalToolSearchListResponse([externalToolResponse], 1, 0, 1));
		});
	});

	describe('updateExternalTool', () => {
		function setup() {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

			const customParameterCreateParams = new CustomParameterCreateParams();
			customParameterCreateParams.name = 'mockName';
			customParameterCreateParams.default = 'mockDefault';
			customParameterCreateParams.location = CustomParameterLocationParams.PATH;
			customParameterCreateParams.scope = CustomParameterScopeParams.SCHOOL;
			customParameterCreateParams.type = CustomParameterTypeParams.STRING;
			customParameterCreateParams.regex = 'mockRegex';

			const body = new ExternalToolCreateParams();
			body.name = 'mockName';
			body.url = 'mockUrl';
			body.logoUrl = 'mockLogoUrl';
			body.parameters = [customParameterCreateParams];
			body.isHidden = true;
			body.openNewTab = true;

			const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
				name: 'mockName',
				default: 'mockDefault',
				location: CustomParameterLocationParams.PATH,
				scope: CustomParameterScopeParams.SCHOOL,
				type: CustomParameterTypeParams.STRING,
				regex: 'mockRegex',
			});

			const basicToolConfigDO: BasicToolConfigDO = new BasicToolConfigDO({
				type: ToolConfigType.BASIC,
				baseUrl: 'mockUrl',
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

			const customParameterDO: CustomParameterDO = new CustomParameterDO({
				name: 'mockName',
				default: 'mockDefault',
				location: CustomParameterLocation.PATH,
				scope: CustomParameterScope.SCHOOL,
				type: CustomParameterType.STRING,
				regex: 'mockRegex',
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
				body,
				currentUser,
				externalToolResponse,
				externalToolDO,
			};
		}

		describe('should call', () => {
			it('the externalToolDOMapper.updateExternalTool', async () => {
				const { currentUser } = setup();
				const externalToolUpdateParams: ExternalToolUpdateParams = new ExternalToolUpdateParams();

				await controller.updateExternalTool(currentUser, externalToolUpdateParams);

				expect(externalToolMapper.mapUpdateRequestToExternalToolDO).toHaveBeenCalledWith(externalToolUpdateParams);
			});

			it('the externalToolUc', async () => {});

			it('the externalResponseMapper', async () => {});
		});
	});
});
