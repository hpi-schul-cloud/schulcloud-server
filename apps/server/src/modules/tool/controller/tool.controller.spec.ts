import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Authorization } from 'oauth-1.0a';
import { IFindOptions, RoleName, SortOrder } from '@shared/domain';
import { ExternalToolDO, Lti11ToolConfigDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { PaginationParams } from '@shared/controller';
import { Page } from '@shared/domain/interface/page';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { Logger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { ToolController } from './tool.controller';
import { Lti11Uc } from '../uc/lti11.uc';
import { ExternalToolUc } from '../uc/external-tool.uc';
import { ExternalToolRequestMapper, ExternalToolResponseMapper, Lti11ResponseMapper } from './mapper';
import {
	BasicToolConfigParams,
	BasicToolConfigResponse,
	CustomParameterPostParams,
	CustomParameterResponse,
	ExternalToolPostParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	ExternalToolSortOrder,
	Lti11LaunchResponse,
	Lti11ToolConfigParams,
	Lti11ToolConfigResponse,
	Oauth2ToolConfigParams,
	Oauth2ToolConfigResponse,
	SortExternalToolParams,
	ToolIdParams,
} from './dto';
import {
	CustomParameterLocationParams,
	CustomParameterScopeParams,
	CustomParameterTypeParams,
	LtiMessageType,
	LtiPrivacyPermission,
	TokenEndpointAuthMethod,
	ToolConfigType,
} from '../interface';

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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	const setupExternalTool = () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

		const customParameterResponse: CustomParameterResponse = new CustomParameterResponse({
			name: 'mockName',
			defaultValue: 'mockDefault',
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

		const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();

		externalToolMapper.mapUpdateRequest.mockReturnValue(externalToolDO);
		externalToolUc.createExternalTool.mockResolvedValue(externalToolDO);
		externalToolResponseMapper.mapToResponse.mockReturnValue(externalToolResponse);

		return {
			currentUser,
			externalToolResponse,
			externalToolDO,
		};
	};

	describe('getLti11LaunchParameters', () => {
		it('should fetch the authorized launch parameters and return the response', async () => {
			const currentUser: ICurrentUser = { userId: 'userId', roles: [RoleName.USER] } as ICurrentUser;
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
			expect(lti11Uc.getLaunchParameters).toHaveBeenCalledWith(
				currentUser.userId,
				currentUser.roles[0],
				toolId,
				courseId
			);
		});
	});

	describe('createExternalTool', () => {
		const setupCreate = () => {
			const customParameterCreateParams = new CustomParameterPostParams();
			customParameterCreateParams.name = 'mockName';
			customParameterCreateParams.defaultValue = 'mockDefault';
			customParameterCreateParams.location = CustomParameterLocationParams.PATH;
			customParameterCreateParams.scope = CustomParameterScopeParams.SCHOOL;
			customParameterCreateParams.type = CustomParameterTypeParams.STRING;
			customParameterCreateParams.regex = 'mockRegex';

			const body = new ExternalToolPostParams();
			body.name = 'mockName';
			body.url = 'mockUrl';
			body.logoUrl = 'mockLogoUrl';
			body.parameters = [customParameterCreateParams];
			body.isHidden = true;
			body.openNewTab = true;

			return {
				body,
			};
		};

		describe('when creating an oauthTool', () => {
			const oauthSetup = () => {
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
			};

			it('should return external tool response with oauth2 config', async () => {
				const { currentUser, externalToolResponse, externalToolDO } = setupExternalTool();
				const { body } = setupCreate();
				const { bodyConfigCreateOauthParams, oauth2ToolConfigResponse, oauth2ToolConfigDO } = oauthSetup();
				body.config = bodyConfigCreateOauthParams;
				externalToolResponse.config = oauth2ToolConfigResponse;
				externalToolDO.config = oauth2ToolConfigDO;

				const expected = await controller.createExternalTool(currentUser, body);

				expect(expected).toEqual(externalToolResponse);
			});
		});

		describe('when creating basic tool', () => {
			const basicSetup = () => {
				const bodyConfigCreateBasicParams = new BasicToolConfigParams();
				bodyConfigCreateBasicParams.type = ToolConfigType.BASIC;
				bodyConfigCreateBasicParams.baseUrl = 'mockUrl';

				return {
					bodyConfigCreateBasicParams,
				};
			};

			it('should return basic external tool response', async () => {
				const { currentUser, externalToolResponse } = setupExternalTool();
				const { body } = setupCreate();
				const { bodyConfigCreateBasicParams } = basicSetup();
				body.config = bodyConfigCreateBasicParams;

				const expected = await controller.createExternalTool(currentUser, body);

				expect(expected).toEqual(externalToolResponse);
			});
		});

		describe('when creating an lti tool', () => {
			const ltiSetup = () => {
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
			};

			it('should return external tool response with lti config', async () => {
				const { currentUser, externalToolResponse, externalToolDO } = setupExternalTool();
				const { body } = setupCreate();
				const { bodyConfigCreateLti11Params, lti11ToolConfigResponse, lti11ToolConfigDO } = ltiSetup();
				body.config = bodyConfigCreateLti11Params;
				externalToolResponse.config = lti11ToolConfigResponse;
				externalToolDO.config = lti11ToolConfigDO;

				const expected = await controller.createExternalTool(currentUser, body);

				expect(expected).toEqual(externalToolResponse);
			});
		});
	});

	describe('findExternalTool', () => {
		const setupFind = () => {
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
		};

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

	describe('getExternalTool', () => {
		const setupGetById = () => {
			const toolIdParams: ToolIdParams = new ToolIdParams();
			toolIdParams.toolId = 'toolId';

			return {
				toolIdParams,
			};
		};

		it('should call the uc to fetch a tool', async () => {
			const { currentUser } = setupExternalTool();
			const { toolIdParams } = setupGetById();

			await controller.getExternalTool(currentUser, toolIdParams);

			expect(externalToolUc.getExternalTool).toHaveBeenCalledWith(currentUser.userId, toolIdParams.toolId);
		});

		it('should fetch a tool', async () => {
			const { currentUser, externalToolResponse } = setupExternalTool();
			const { toolIdParams } = setupGetById();

			const result: ExternalToolResponse = await controller.getExternalTool(currentUser, toolIdParams);

			expect(result).toEqual(externalToolResponse);
		});
	});

	describe('deleteExternalTool', () => {
		it('should call the uc', async () => {
			const params: ToolIdParams = new ToolIdParams();
			params.toolId = 'toolId';
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;

			await controller.deleteExternalTool(currentUser, params);

			expect(externalToolUc.deleteExternalTool).toHaveBeenCalledWith(currentUser.userId, params.toolId);
		});
	});

	describe('updateExternalTool', () => {
		function setupUpdate() {
			const toolIdParams: ToolIdParams = new ToolIdParams();
			toolIdParams.toolId = 'toolId';

			const customParameterPostParams = new CustomParameterPostParams();
			customParameterPostParams.name = 'mockName';
			customParameterPostParams.defaultValue = 'mockDefault';
			customParameterPostParams.location = CustomParameterLocationParams.PATH;
			customParameterPostParams.scope = CustomParameterScopeParams.SCHOOL;
			customParameterPostParams.type = CustomParameterTypeParams.STRING;
			customParameterPostParams.regex = 'mockRegex';

			const body = new ExternalToolPostParams();
			body.name = 'mockName';
			body.url = 'mockUrl';
			body.logoUrl = 'mockLogoUrl';
			body.parameters = [customParameterPostParams];
			body.isHidden = true;
			body.openNewTab = true;

			return {
				toolIdParams,
				body,
			};
		}

		it('should call the uc to fetch a tool', async () => {
			const { currentUser, externalToolDO } = setupExternalTool();
			const { toolIdParams, body } = setupUpdate();

			await controller.updateExternalTool(currentUser, toolIdParams, body);

			expect(externalToolUc.updateExternalTool).toHaveBeenCalledWith(
				currentUser.userId,
				toolIdParams.toolId,
				externalToolDO
			);
		});

		it('should return a tool', async () => {
			const { currentUser, externalToolResponse } = setupExternalTool();
			const { toolIdParams, body } = setupUpdate();

			const result: ExternalToolResponse = await controller.updateExternalTool(currentUser, toolIdParams, body);

			expect(result).toEqual(externalToolResponse);
		});
	});
});
