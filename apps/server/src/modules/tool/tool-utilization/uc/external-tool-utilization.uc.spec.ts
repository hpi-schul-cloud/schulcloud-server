import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { ExternalTool, ExternalToolService } from '../../external-tool';
import { externalToolFactory } from '../../external-tool/testing';
import { ExternalToolUtilization } from '../domain';
import { ExternalToolUtilizationService } from '../service';
import { ExternalToolUtilizationUc } from './external-tool-utilization.uc';

describe(ExternalToolUtilizationUc.name, () => {
	let module: TestingModule;
	let uc: ExternalToolUtilizationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let externalToolUtilizationService: DeepMocked<ExternalToolUtilizationService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				ExternalToolUtilizationUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ExternalToolUtilizationService,
					useValue: createMock<ExternalToolUtilizationService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolUtilizationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		externalToolUtilizationService = module.get(ExternalToolUtilizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUtilizationForExternalTool', () => {
		describe('when authorize user', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();
				const tool: ExternalTool = externalToolFactory.buildWithId({ id: toolId }, toolId);

				const role: Role = roleFactory.buildWithId({ permissions: [Permission.TOOL_ADMIN] });
				const user: User = userFactory.buildWithId({ roles: [role] });
				const currentUser = currentUserFactory.build();
				const context = { action: Action.read, requiredPermissions: [Permission.TOOL_ADMIN] };

				externalToolService.findById.mockResolvedValueOnce(tool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					currentUser,
					toolId,
					tool,
					context,
				};
			};

			it('get user with permissions', async () => {
				const { toolId, user } = setup();

				await uc.getUtilizationForExternalTool(user.id, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should check that the user has TOOL_ADMIN permission', async () => {
				const { user, tool } = setup();

				await uc.getUtilizationForExternalTool(user.id, tool.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					tool,
					AuthorizationContextBuilder.read([Permission.TOOL_ADMIN])
				);
			});
		});

		describe('when user has insufficient permission to get an metadata for external tool ', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const user: User = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockRejectedValue(new UnauthorizedException());

				return {
					user,
					toolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { toolId, user } = setup();

				const result: Promise<ExternalToolUtilization> = uc.getUtilizationForExternalTool(user.id, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when externalToolId is given', () => {
			const setup = () => {
				const toolId: string = new ObjectId().toHexString();

				const externalToolMetadata: ExternalToolUtilization = new ExternalToolUtilization({
					schoolExternalToolCount: 2,
					contextExternalToolCountPerContext: { course: 3, boardElement: 3, mediaBoard: 2 },
				});

				externalToolUtilizationService.getUtilizationForExternalTool.mockResolvedValueOnce(externalToolMetadata);

				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					user,
					currentUser,
					toolId,
					externalToolMetadata,
				};
			};

			it('get metadata for external tool', async () => {
				const { toolId, currentUser } = setup();

				await uc.getUtilizationForExternalTool(currentUser.userId, toolId);

				expect(externalToolUtilizationService.getUtilizationForExternalTool).toHaveBeenCalledWith(toolId);
			});

			it('return metadata of external tool', async () => {
				const { toolId, currentUser, externalToolMetadata } = setup();

				const result = await uc.getUtilizationForExternalTool(currentUser.userId, toolId);

				expect(result).toEqual(externalToolMetadata);
			});
		});
	});
});
