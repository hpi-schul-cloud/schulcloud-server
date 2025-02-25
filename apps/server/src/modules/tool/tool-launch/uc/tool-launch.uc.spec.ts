import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { LaunchContextUnavailableLoggableException } from '@modules/tool/tool-launch/error';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool, ContextExternalToolLaunchable } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ToolLaunchService } from '../service';
import { toolLaunchRequestFactory } from '../testing';
import { ToolLaunchRequest } from '../types';
import { ToolLaunchUc } from './tool-launch.uc';

describe('ToolLaunchUc', () => {
	let module: TestingModule;
	let uc: ToolLaunchUc;

	let toolLaunchService: DeepMocked<ToolLaunchService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolLaunchUc,
				{
					provide: ToolLaunchService,
					useValue: createMock<ToolLaunchService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get<ToolLaunchUc>(ToolLaunchUc);
		toolLaunchService = module.get(ToolLaunchService);
		contextExternalToolService = module.get(ContextExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
	});

	beforeAll(async () => {
		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getContextExternalToolLaunchRequest', () => {
		describe('when tool exists', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const contextExternalToolId = 'contextExternalToolId';
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					id: contextExternalToolId,
				});

				const toolLaunchRequest: ToolLaunchRequest = toolLaunchRequestFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				toolLaunchService.generateLaunchRequest.mockResolvedValueOnce(toolLaunchRequest);

				return {
					user,
					contextExternalToolId,
					contextExternalTool,
					toolLaunchRequest,
				};
			};

			it('should check user permissions to launch the tool', async () => {
				const { user, contextExternalToolId, contextExternalTool } = setup();

				await uc.getContextExternalToolLaunchRequest(user.id, contextExternalToolId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
				);
			});

			it('should call service to get context external tool', async () => {
				const { user, contextExternalToolId } = setup();

				await uc.getContextExternalToolLaunchRequest(user.id, contextExternalToolId);

				expect(contextExternalToolService.findByIdOrFail).toHaveBeenCalledWith(contextExternalToolId);
			});

			it('should call service to generate launch request', async () => {
				const { user, contextExternalToolId, contextExternalTool, toolLaunchRequest } = setup();

				toolLaunchService.generateLaunchRequest.mockResolvedValueOnce(toolLaunchRequest);

				await uc.getContextExternalToolLaunchRequest(user.id, contextExternalToolId);

				expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(user.id, contextExternalTool);
			});

			it('should return launch request', async () => {
				const { user, contextExternalToolId } = setup();

				const toolLaunchRequest: ToolLaunchRequest = await uc.getContextExternalToolLaunchRequest(
					user.id,
					contextExternalToolId
				);

				expect(toolLaunchRequest).toBeDefined();
			});
		});
	});

	describe('getSchoolExternalToolLaunchRequest', () => {
		describe('when tool exists', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const schoolExternalToolId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({ id: schoolExternalToolId });
				const contextExternalTool: ContextExternalToolLaunchable = {
					schoolToolRef: {
						schoolToolId: schoolExternalToolId,
					},
					contextRef: {
						type: ToolContextType.MEDIA_BOARD,
						id: new ObjectId().toHexString(),
					},
					parameters: [],
				};

				const toolLaunchRequest = toolLaunchRequestFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				toolLaunchService.generateLaunchRequest.mockResolvedValueOnce(toolLaunchRequest);

				return {
					user,
					schoolExternalTool,
					contextExternalTool,
					toolLaunchRequest,
				};
			};

			it('should check user permissions to launch the tool', async () => {
				const { user, contextExternalTool, schoolExternalTool } = setup();

				await uc.getSchoolExternalToolLaunchRequest(user.id, contextExternalTool);

				expect(toolPermissionHelper.ensureContextPermissionsForSchool).toHaveBeenCalledWith(
					user,
					schoolExternalTool,
					contextExternalTool.contextRef.id,
					contextExternalTool.contextRef.type,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
				);
			});

			it('should check for context restrictions', async () => {
				const { user, contextExternalTool } = setup();

				await uc.getSchoolExternalToolLaunchRequest(user.id, contextExternalTool);

				expect(contextExternalToolService.checkContextRestrictions).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call service to generate launch request', async () => {
				const { user, contextExternalTool, toolLaunchRequest } = setup();

				toolLaunchService.generateLaunchRequest.mockResolvedValueOnce(toolLaunchRequest);

				await uc.getSchoolExternalToolLaunchRequest(user.id, contextExternalTool);

				expect(toolLaunchService.generateLaunchRequest).toHaveBeenCalledWith(user.id, contextExternalTool);
			});

			it('should return launch request', async () => {
				const { user, contextExternalTool, toolLaunchRequest } = setup();

				const result = await uc.getSchoolExternalToolLaunchRequest(user.id, contextExternalTool);

				expect(result).toEqual(toolLaunchRequest);
			});
		});

		describe('when launching a context that is not available', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const schoolExternalToolId = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({ id: schoolExternalToolId });
				const contextExternalTool: ContextExternalToolLaunchable = {
					schoolToolRef: {
						schoolToolId: schoolExternalToolId,
					},
					contextRef: {
						type: ToolContextType.COURSE,
						id: new ObjectId().toHexString(),
					},
					parameters: [],
				};

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw an exception', async () => {
				const { user, contextExternalTool } = setup();

				await expect(uc.getSchoolExternalToolLaunchRequest(user.id, contextExternalTool)).rejects.toThrow(
					LaunchContextUnavailableLoggableException
				);
			});
		});
	});
});
