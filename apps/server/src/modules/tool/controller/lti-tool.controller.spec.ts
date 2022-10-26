import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser, IFindOptions, LtiPrivacyPermission, LtiRoleType, SortOrder } from '@shared/domain';
import { LtiToolController } from '@src/modules/tool/controller/lti-tool.controller';
import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { ToolIdParams } from '@src/modules/tool/controller/dto/request/tool-id.params';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/response/lti-tool.response';
import { LtiToolPostBody } from '@src/modules/tool/controller/dto/request/lti-tool-post.body';
import { LtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool.params';
import { PaginationParams } from '@shared/controller';
import { LtiToolSortOrder, SortLtiToolParams } from '@src/modules/tool/controller/dto/request/lti-tool-sort.params';
import { LtiToolSearchListResponse } from '@src/modules/tool/controller/dto/response/lti-tool-search-list.response';

describe('LtiToolController', () => {
	let module: TestingModule;
	let controller: LtiToolController;

	let ltiToolUc: DeepMocked<LtiToolUc>;
	let ltiToolMapper: DeepMocked<LtiToolMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LtiToolController,
				{
					provide: LtiToolUc,
					useValue: createMock<LtiToolUc>(),
				},
				{
					provide: LtiToolMapper,
					useValue: createMock<LtiToolMapper>(),
				},
			],
		}).compile();

		controller = module.get(LtiToolController);
		ltiToolUc = module.get(LtiToolUc);
		ltiToolMapper = module.get(LtiToolMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	function setup() {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		const toolIdParams: ToolIdParams = { toolId: 'toolId' };
		const ltiToolDO: LtiToolDO = new LtiToolDO({
			id: 'id',
			name: 'name',
			url: 'url',
			key: 'key',
			secret: 'secret',
			logo_url: 'logo_url',
			customs: [{ key: 'key', value: 'value' }],
			friendlyUrl: 'friendlyUrl',
			frontchannel_logout_uri: 'frontchannel_logout_uri',
			isHidden: false,
			isLocal: false,
			isTemplate: false,
			lti_message_type: 'lti_message_type',
			lti_version: 'lti_version',
			oAuthClientId: 'oAuthClientId',
			openNewTab: false,
			originToolId: 'originToolId',
			privacy_permission: LtiPrivacyPermission.EMAIL,
			resource_link_id: 'resource_link_id',
			roles: [LtiRoleType.LEARNER, LtiRoleType.MENTOR],
			skipConsent: false,
		});
		const ltiToolResponse: LtiToolResponse = new LtiToolResponse({ ...ltiToolDO, _id: 'id' } as LtiToolResponse);
		const ltiToolBody: LtiToolPostBody = ltiToolDO;

		return {
			currentUser,
			toolIdParams,
			ltiToolDO,
			ltiToolResponse,
			ltiToolBody,
		};
	}

	describe('findLtiTool', () => {
		function setupFind() {
			const { currentUser, ltiToolDO, ltiToolResponse } = setup();
			const filterQuery: LtiToolParams = new LtiToolParams();
			const pagination: PaginationParams = { skip: 0, limit: 1 };
			const sortingQuery: SortLtiToolParams = { sortOrder: SortOrder.asc, sortBy: LtiToolSortOrder.NAME };
			const filter: IFindOptions<LtiToolDO> = { pagination: { skip: 0, limit: 1 }, order: { name: SortOrder.asc } };

			ltiToolMapper.mapSortingQueryToDomain.mockReturnValue(filter.order);
			ltiToolMapper.mapLtiToolFilterQueryToDO.mockReturnValue({});
			ltiToolUc.findLtiTool.mockResolvedValue({ data: [ltiToolDO], total: 1 });
			ltiToolMapper.mapDoToResponse.mockReturnValue(ltiToolResponse);

			return {
				currentUser,
				ltiToolDO,
				ltiToolResponse,
				filterQuery,
				pagination,
				sortingQuery,
				filter,
			};
		}

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should call the ltiToolUc', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, filter } = setupFind();

			await controller.findLtiTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(ltiToolUc.findLtiTool).toHaveBeenCalledWith(currentUser, {}, filter);
		});

		it('should call the ltiToolResponseMapper.mapSortingQueryToDomain', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery } = setupFind();

			await controller.findLtiTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(ltiToolMapper.mapSortingQueryToDomain).toHaveBeenCalledWith(sortingQuery);
		});

		it('should call the ltiToolResponseMapper.mapLtiToolFilterQueryToDO', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery } = setupFind();

			await controller.findLtiTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(ltiToolMapper.mapLtiToolFilterQueryToDO).toHaveBeenCalledWith(filterQuery);
		});

		it('should call the ltiToolResponseMapper.mapDoToResponse', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, ltiToolDO } = setupFind();

			await controller.findLtiTool(currentUser, filterQuery, pagination, sortingQuery);

			expect(ltiToolMapper.mapDoToResponse).toBeCalledTimes(1);
			expect(ltiToolMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return a ltiToolResponse', async () => {
			const { currentUser, filterQuery, pagination, sortingQuery, ltiToolResponse } = setupFind();

			const result: LtiToolSearchListResponse = await controller.findLtiTool(
				currentUser,
				filterQuery,
				pagination,
				sortingQuery
			);

			expect(result).toEqual(new LtiToolSearchListResponse([ltiToolResponse], 1, 0, 1));
		});
	});

	describe('getLtiTool', () => {
		it('should call the ltiToolUc', async () => {
			const { currentUser, toolIdParams } = setup();

			await controller.getLtiTool(currentUser, toolIdParams);

			expect(ltiToolUc.getLtiTool).toHaveBeenCalledWith(currentUser, toolIdParams.toolId);
		});

		it('should call ltiToolMapper.mapDoToResponse', async () => {
			const { currentUser, toolIdParams, ltiToolDO } = setup();
			ltiToolUc.getLtiTool.mockResolvedValue(ltiToolDO);

			await controller.getLtiTool(currentUser, toolIdParams);

			expect(ltiToolMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return a ltiToolResponse', async () => {
			const { currentUser, toolIdParams, ltiToolDO, ltiToolResponse } = setup();
			ltiToolUc.getLtiTool.mockResolvedValue(ltiToolDO);
			ltiToolMapper.mapDoToResponse.mockReturnValue(ltiToolResponse);

			const response: LtiToolResponse = await controller.getLtiTool(currentUser, toolIdParams);

			expect(response).toEqual(ltiToolResponse);
		});
	});

	describe('createLtiTool', () => {
		it('should call ltiToolMapper.mapLtiToolPostBodyToDO', async () => {
			const { currentUser, ltiToolBody } = setup();

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolMapper.mapLtiToolPostBodyToDO).toHaveBeenCalledWith(ltiToolBody);
		});

		it('should call the ltiToolUc', async () => {
			const { currentUser, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolUc.createLtiTool).toHaveBeenCalledWith(currentUser, ltiToolDO);
		});

		it('should call ltiToolMapper.mapDoToResponse', async () => {
			const { currentUser, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.createLtiTool.mockResolvedValue(ltiToolDO);

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return the ltiToolResponse', async () => {
			const { currentUser, ltiToolBody, ltiToolDO, ltiToolResponse } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.createLtiTool.mockResolvedValue(ltiToolDO);

			const response: LtiToolResponse = await controller.createLtiTool(currentUser, ltiToolBody);

			expect(response).toEqual(ltiToolResponse);
		});
	});

	describe('updateLtiTool', () => {
		it('should call ltiToolMapper.mapLtiToolPostBodyToDO', async () => {
			const { currentUser, toolIdParams, ltiToolBody } = setup();

			await controller.updateLtiTool(currentUser, toolIdParams, ltiToolBody);

			expect(ltiToolMapper.mapLtiToolPostBodyToDO).toHaveBeenCalledWith(ltiToolBody);
		});

		it('should call the ltiToolUc', async () => {
			const { currentUser, toolIdParams, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);

			await controller.updateLtiTool(currentUser, toolIdParams, ltiToolBody);

			expect(ltiToolUc.updateLtiTool).toHaveBeenCalledWith(currentUser, toolIdParams.toolId, ltiToolDO);
		});

		it('should call ltiToolMapper.mapDoToResponse', async () => {
			const { currentUser, toolIdParams, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.updateLtiTool.mockResolvedValue(ltiToolDO);

			await controller.updateLtiTool(currentUser, toolIdParams, ltiToolBody);

			expect(ltiToolMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return a ltiToolResponse', async () => {
			const { currentUser, toolIdParams, ltiToolBody, ltiToolDO, ltiToolResponse } = setup();
			ltiToolMapper.mapLtiToolPostBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.updateLtiTool.mockResolvedValue(ltiToolDO);
			ltiToolMapper.mapDoToResponse.mockReturnValue(ltiToolResponse);

			const response: LtiToolResponse = await controller.updateLtiTool(currentUser, toolIdParams, ltiToolBody);

			expect(response).toBeDefined();
		});
	});

	describe('deleteLtiTool', () => {
		it('should call the ltiToolUc', async () => {
			const { currentUser, toolIdParams } = setup();

			await controller.deleteLtiTool(currentUser, toolIdParams);

			expect(ltiToolUc.deleteLtiTool).toHaveBeenCalledWith(currentUser, toolIdParams.toolId);
		});

		it('should return a ltiToolResponse after deletion', async () => {
			const { currentUser, toolIdParams, ltiToolDO } = setup();
			ltiToolUc.deleteLtiTool.mockResolvedValue(ltiToolDO);

			const response: LtiToolResponse = await controller.deleteLtiTool(currentUser, toolIdParams);

			expect(response).toBeDefined();
		});
	});
});
