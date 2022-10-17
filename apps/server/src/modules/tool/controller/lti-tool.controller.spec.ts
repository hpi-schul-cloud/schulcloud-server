import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser, LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { LtiToolController } from '@src/modules/tool/controller/lti-tool.controller';
import { LtiToolMapper } from '@src/modules/tool/mapper/lti-tool.mapper';
import { LtiToolResponseMapper } from '@src/modules/tool/mapper/lti-tool-response.mapper';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { ToolIdParams } from '@src/modules/tool/controller/dto/tool-id.params';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { LtiToolResponse } from '@src/modules/tool/controller/dto/lti-tool.response';
import { LtiToolBody } from '@src/modules/tool/controller/dto/lti-tool.body';

describe('LtiToolController', () => {
	let module: TestingModule;
	let controller: LtiToolController;

	let ltiToolUc: DeepMocked<LtiToolUc>;
	let ltiToolResponseMapper: DeepMocked<LtiToolResponseMapper>;
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
					provide: LtiToolResponseMapper,
					useValue: createMock<LtiToolResponseMapper>(),
				},
				{
					provide: LtiToolMapper,
					useValue: createMock<LtiToolMapper>(),
				},
			],
		}).compile();

		controller = module.get(LtiToolController);
		ltiToolUc = module.get(LtiToolUc);
		ltiToolResponseMapper = module.get(LtiToolResponseMapper);
		ltiToolMapper = module.get(LtiToolMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	function setup() {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		let toolIdParams: ToolIdParams = { toolId: 'toolId' };
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
		const ltiToolResponse: LtiToolResponse = new LtiToolResponse(ltiToolDO as LtiToolResponse);
		const ltiToolBody: LtiToolBody = new LtiToolBody(ltiToolDO as LtiToolDO);
		return {
			currentUser,
			toolIdParams,
			ltiToolDO,
			ltiToolResponse,
			ltiToolBody,
		};
	}

	describe('findLtiTool', () => {
		it('should call the ltiToolUc', async () => {
			const { currentUser } = setup();
		});

		it('should call the ltiToolResponseMapper', async () => {});

		it('should return a ltiToolResponse', async () => {});
	});

	describe('getLtiTool', () => {
		it('should call the ltiToolUc', async () => {
			const { currentUser, toolIdParams } = setup();

			await controller.getLtiTool(currentUser, toolIdParams);

			expect(ltiToolUc.getLtiTool).toHaveBeenCalledWith(currentUser, toolIdParams.toolId);
		});

		it('should call the ltiToolResponseMapper', async () => {
			const { currentUser, toolIdParams, ltiToolDO } = setup();
			ltiToolUc.getLtiTool.mockResolvedValue(ltiToolDO);

			await controller.getLtiTool(currentUser, toolIdParams);

			expect(ltiToolResponseMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return a ltiToolResponse', async () => {
			const { currentUser, toolIdParams, ltiToolDO, ltiToolResponse } = setup();
			ltiToolUc.getLtiTool.mockResolvedValue(ltiToolDO);
			ltiToolResponseMapper.mapDoToResponse.mockReturnValue(ltiToolResponse);

			const response: LtiToolResponse = await controller.getLtiTool(currentUser, toolIdParams);

			expect(response).toEqual(ltiToolResponse);
		});
	});

	describe('createLtiTool', () => {
		it('should call the ltiToolMapper', async () => {
			const { currentUser, ltiToolBody } = setup();

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolMapper.mapLtiToolBodyToDO).toHaveBeenCalledWith(ltiToolBody);
		});

		it('should call the ltiToolUc', async () => {
			const { currentUser, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolBodyToDO.mockReturnValue(ltiToolDO);

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolUc.createLtiTool).toHaveBeenCalledWith(currentUser, ltiToolDO);
		});

		it('should call the ltiToolResponseMapper', async () => {
			const { currentUser, ltiToolBody, ltiToolDO } = setup();
			ltiToolMapper.mapLtiToolBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.createLtiTool.mockResolvedValue(ltiToolDO);

			await controller.createLtiTool(currentUser, ltiToolBody);

			expect(ltiToolResponseMapper.mapDoToResponse).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should call the ltiToolResponseMapper', async () => {
			const { currentUser, ltiToolBody, ltiToolDO, ltiToolResponse } = setup();
			ltiToolMapper.mapLtiToolBodyToDO.mockReturnValue(ltiToolDO);
			ltiToolUc.createLtiTool.mockResolvedValue(ltiToolDO);

			const response: LtiToolResponse = await controller.createLtiTool(currentUser, ltiToolBody);

			expect(response).toEqual(ltiToolResponse);
		});
	});

	describe('updateLtiTool', () => {
		it('', async () => {});
	});

	describe('deleteLtiTool', () => {
		it('should call the ltiToolUc', async () => {
			const { currentUser, toolIdParams } = setup();

			controller.deleteLtiTool(currentUser, toolIdParams);

			expect(ltiToolUc.deleteLtiTool).toHaveBeenCalledWith(currentUser, toolIdParams.toolId);
		});

		it('should return a promise after deletion', async () => {
			const { currentUser, toolIdParams } = setup();
			ltiToolUc.deleteLtiTool.mockResolvedValue(Promise.resolve());

			const promise: Promise<void> = controller.deleteLtiTool(currentUser, toolIdParams);

			expect(promise).toBeDefined();
		});
	});
});
