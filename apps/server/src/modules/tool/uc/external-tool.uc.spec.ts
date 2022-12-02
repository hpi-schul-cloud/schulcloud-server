import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@src/modules';
import { ExternalToolDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { ICurrentUser, IFindOptions, Permission, SortOrder, ToolConfigType, User } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { Page } from '@shared/domain/interface/page';
import {
	externalToolDOFactory,
	oauth2ToolConfigDOFactory,
} from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolUc } from './external-tool.uc';
import { ExternalToolService } from '../service/external-tool.service';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';

describe('ExternalToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: ExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		orm = await setupEntities();

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
			],
		}).compile();

		uc = module.get(ExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setup = () => {
		const toolId = 'toolId';

		const externalToolDO: ExternalToolDO = externalToolDOFactory.withCustomParameters(1).buildWithId();
		const oauth2ConfigWithoutExternalData: Oauth2ToolConfigDO = oauth2ToolConfigDOFactory.build();

		const query: Partial<ExternalToolDO> = {
			id: externalToolDO.id,
			name: externalToolDO.name,
		};
		const options: IFindOptions<ExternalToolDO> = {
			order: {
				id: SortOrder.asc,
				name: SortOrder.asc,
			},
			pagination: {
				limit: 2,
				skip: 1,
			},
		};
		const page: Page<ExternalToolDO> = new Page<ExternalToolDO>(
			[{ ...externalToolDO, config: oauth2ConfigWithoutExternalData }],
			1
		);

		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;

		authorizationService.getUserWithPermissions.mockResolvedValue(user);
		externalToolService.isNameUnique.mockResolvedValue(true);
		externalToolService.isClientIdUnique.mockResolvedValue(true);
		externalToolService.hasDuplicateAttributes.mockReturnValue(false);
		externalToolService.validateByRegex.mockReturnValue(true);
		externalToolService.createExternalTool.mockResolvedValue(externalToolDO);
		externalToolService.findExternalTools.mockResolvedValue(page);

		return {
			externalToolDO,
			oauth2ConfigWithoutExternalData,
			user,
			currentUser,
			options,
			page,
			query,
			toolId,
		};
	};

	describe('createExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, externalToolDO } = setup();

				await uc.createExternalTool(currentUser.userId, externalToolDO);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user, externalToolDO } = setup();

				await uc.createExternalTool(currentUser.userId, externalToolDO);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to create an external tool', async () => {
				const { currentUser, externalToolDO } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('Validation', () => {
			const oauthSetup = () => {
				const oauth2Config: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
					type: ToolConfigType.OAUTH2,
					baseUrl: 'baseUrl',
					clientId: 'clientId',
					clientSecret: 'clientSecret',
					skipConsent: false,
					tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
					frontchannelLogoutUri: 'frontchannelLogoutUri',
					scope: 'openid offline',
					redirectUris: ['redirectUri1', 'redirectUri2'],
				});

				return {
					oauth2Config,
				};
			};

			it('should pass if tool name is unique, it has no duplicate attributes, all regex are valid and the client id is unique', async () => {
				const { oauth2Config } = oauthSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = oauth2Config;

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).resolves.not.toThrow(UnprocessableEntityException);
			});

			it('should throw if the client id is not unique', async () => {
				const { oauth2Config } = oauthSetup();
				const { externalToolDO, currentUser } = setup();
				externalToolDO.config = oauth2Config;
				externalToolService.isClientIdUnique.mockResolvedValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if name is not unique', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.isNameUnique.mockResolvedValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if tool has duplicate custom attributes', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.hasDuplicateAttributes.mockReturnValue(true);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});

			it('should throw if tool has custom attributes with invalid regex', async () => {
				const { externalToolDO, currentUser } = setup();
				externalToolService.validateByRegex.mockReturnValue(false);

				const result: Promise<ExternalToolDO> = uc.createExternalTool(currentUser.userId, externalToolDO);

				await expect(result).rejects.toThrow(UnprocessableEntityException);
			});
		});

		it('should call the service to save a tool', async () => {
			const { externalToolDO, currentUser } = setup();

			await uc.createExternalTool(currentUser.userId, externalToolDO);

			expect(externalToolService.createExternalTool).toHaveBeenCalledWith(externalToolDO);
		});

		it('should return saved a tool', async () => {
			const { externalToolDO, currentUser } = setup();

			const result: ExternalToolDO = await uc.createExternalTool(currentUser.userId, externalToolDO);

			expect(result).toEqual(externalToolDO);
		});
	});

	describe('findExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, query, options } = setup();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, query, options, user } = setup();

				await uc.findExternalTool(currentUser.userId, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to find an external tool', async () => {
				const { currentUser, query, options } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<Page<ExternalToolDO>> = uc.findExternalTool(currentUser.userId, query, options);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should call the externalToolService', async () => {
			const { currentUser, query, options } = setup();

			await uc.findExternalTool(currentUser.userId, query, options);

			expect(externalToolService.findExternalTools).toHaveBeenCalledWith(query, options);
		});

		it('should return a page of externalToolDO', async () => {
			const { currentUser, query, options, page } = setup();
			externalToolService.findExternalTools.mockResolvedValue(page);

			const resultPage: Page<ExternalToolDO> = await uc.findExternalTool(currentUser.userId, query, options);

			expect(resultPage).toEqual(page);
		});
	});

	describe('getExternalTool', () => {
		describe('Authorization', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, toolId } = setup();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user, toolId } = setup();

				await uc.getExternalTool(currentUser.userId, toolId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_ADMIN]);
			});

			it('should throw if the user has insufficient permission to get an external tool', async () => {
				const { currentUser, toolId } = setup();
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.getExternalTool(currentUser.userId, toolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		it('should fetch a tool', async () => {
			const { currentUser, externalToolDO } = setup();
			externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

			const result: ExternalToolDO = await uc.getExternalTool(currentUser.userId, 'toolId');

			expect(result).toEqual(externalToolDO);
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
