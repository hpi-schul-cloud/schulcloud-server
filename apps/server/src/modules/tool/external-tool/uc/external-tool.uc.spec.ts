import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IFindOptions, Permission, SortOrder, User } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { setupEntities, userFactory } from '@shared/testing';
import {
	externalToolFactory,
	oauth2ToolConfigFactory,
} from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { AuthorizationService } from '@src/modules/authorization';
import { ICurrentUser } from '@src/modules/authentication';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ExternalToolUc } from './external-tool.uc';
import { ExternalToolService, ExternalToolValidationService } from '../service';

import { ExternalToolUpdate } from './dto';
import { ExternalTool, Oauth2ToolConfig } from '../domain';

describe('ExternalToolUc', () => {
	let module: TestingModule;
	let uc: ExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let toolValidationService: DeepMocked<ExternalToolValidationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ExternalToolValidationService,
					useValue: createMock<ExternalToolValidationService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		toolValidationService = module.get(ExternalToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setupAuthorization = () => {
		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

		authorizationService.getUserWithPermissions.mockResolvedValue(user);

		return {
			user,
			currentUser,
		};
	};

	const setup = () => {
		const toolId = 'toolId';

		const externalTool: ExternalTool = externalToolFactory.withCustomParameters(1).buildWithId();
		const oauth2ConfigWithoutExternalData: Oauth2ToolConfig = oauth2ToolConfigFactory.build();

		const query: ExternalToolSearchQuery = {
			name: externalTool.name,
		};
		const options: IFindOptions<ExternalTool> = {
			order: {
				id: SortOrder.asc,
				name: SortOrder.asc,
			},
			pagination: {
				limit: 2,
				skip: 1,
			},
		};
		const page: Page<ExternalTool> = new Page<ExternalTool>(
			[externalToolFactory.build({ ...externalTool, config: oauth2ConfigWithoutExternalData })],
			1
		);

		externalToolService.createExternalTool.mockResolvedValue(externalTool);
		externalToolService.findExternalTools.mockResolvedValue(page);

		return {
			externalTool,
			oauth2ConfigWithoutExternalData,
			options,
			page,
			query,
			toolId,
		};
	};

	describe('createExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalTool } = setup();

				await uc.createExternalTool(currentUser.userId, externalTool);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { externalTool } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setup();

			await uc.createExternalTool(currentUser.userId, externalTool);

			expect(toolValidationService.validateCreate).toHaveBeenCalledWith(externalTool);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setup();
			toolValidationService.validateCreate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.createExternalTool(currentUser.userId, externalTool);

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to save a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setup();

			await uc.createExternalTool(currentUser.userId, externalTool);

			expect(externalToolService.createExternalTool).toHaveBeenCalledWith(externalTool);
		});

		it('should return saved a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool } = setup();

			const result: ExternalTool = await uc.createExternalTool(currentUser.userId, externalTool);

			expect(result).toEqual(externalTool);
		});
	});

	describe('findExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setup();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { query, options } = setup();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to find an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { query, options } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<Page<ExternalTool>> = uc.findExternalTool(currentUser.userId, query, options);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should call the externalToolService', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options } = setup();

			await uc.findExternalTool(currentUser.userId, query, options);

			expect(externalToolService.findExternalTools).toHaveBeenCalledWith(query, options);
		});

		it('should return a page of externalTool', async () => {
			const { currentUser } = setupAuthorization();
			const { query, options, page } = setup();
			externalToolService.findExternalTools.mockResolvedValue(page);

			const resultPage: Page<ExternalTool> = await uc.findExternalTool(currentUser.userId, query, options);

			expect(resultPage).toEqual(page);
		});
	});

	describe('getExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setup();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId } = setup();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.getExternalTool(currentUser.userId, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should fetch a tool', async () => {
			const { currentUser } = setupAuthorization();
			const { externalTool, toolId } = setup();
			externalToolService.findExternalToolById.mockResolvedValue(externalTool);

			const result: ExternalTool = await uc.getExternalTool(currentUser.userId, toolId);

			expect(result).toEqual(externalTool);
		});
	});

	describe('updateExternalTool', () => {
		const setupUpdate = () => {
			const { externalTool, toolId } = setup();

			const externalToolDOtoUpdate: ExternalToolUpdate = {
				id: toolId,
				...externalTool,
				name: 'newName',
				url: undefined,
				version: 1,
			};
			const updatedExternalToolDO: ExternalTool = externalToolFactory.build({
				...externalTool,
				name: 'newName',
				url: undefined,
			});

			externalToolService.updateExternalTool.mockResolvedValue(updatedExternalToolDO);
			externalToolService.findExternalToolById.mockResolvedValue(new ExternalTool(externalToolDOtoUpdate));

			return {
				externalTool,
				updatedExternalToolDO,
				externalToolDOtoUpdate,
				toolId,
			};
		};

		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setupUpdate();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setupUpdate();

				await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser } = setupAuthorization();
				const { toolId, externalToolDOtoUpdate } = setupUpdate();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalTool> = uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should validate the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate } = setupUpdate();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(toolValidationService.validateUpdate).toHaveBeenCalledWith(toolId, externalToolDOtoUpdate);
		});

		it('should throw if validation of the tool fails', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate } = setupUpdate();
			toolValidationService.validateUpdate.mockImplementation(() => {
				throw new UnprocessableEntityException();
			});

			const result: Promise<ExternalTool> = uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			await expect(result).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call the service to update the tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, updatedExternalToolDO, externalToolDOtoUpdate } = setupUpdate();

			await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(externalToolService.updateExternalTool).toHaveBeenCalledWith(
				externalToolDOtoUpdate,
				updatedExternalToolDO
			);
		});

		it('should return the updated tool', async () => {
			const { currentUser } = setupAuthorization();
			const { toolId, externalToolDOtoUpdate, updatedExternalToolDO } = setupUpdate();

			const result: ExternalTool = await uc.updateExternalTool(currentUser.userId, toolId, externalToolDOtoUpdate);

			expect(result).toEqual(updatedExternalToolDO);
		});
	});

	describe('deleteExternalTool', () => {
		const setupDelete = () => {
			const toolId = 'toolId';
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const user: User = userFactory.buildWithId();

			authorizationService.getUserWithPermissions.mockResolvedValue(user);

			return {
				toolId,
				currentUser,
				user,
			};
		};

		it('should check that the user has TOOL_ADMIN permission', async () => {
			const { toolId, currentUser, user } = setupDelete();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
		});

		it('should call the externalToolService', async () => {
			const { toolId, currentUser } = setupDelete();

			await uc.deleteExternalTool(currentUser.userId, toolId);

			expect(externalToolService.deleteExternalTool).toHaveBeenCalledWith(toolId);
		});
	});
});
