import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolUc } from '@src/modules/tool/uc/lti-tool.uc';
import { AuthorizationService } from '@src/modules';
import { setupEntities, userFactory } from '@shared/testing';
import {
	ICurrentUser,
	IFindOptions,
	LtiPrivacyPermission,
	LtiRoleType,
	Page,
	Permission,
	SortOrder,
	User,
} from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { MikroORM } from '@mikro-orm/core';
import { CustomLtiProperty } from '@shared/domain/domainobject/custom-lti-property';

describe('LtiToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: LtiToolUc;

	let ltiToolRepo: DeepMocked<LtiToolRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				LtiToolUc,
				{
					provide: LtiToolRepo,
					useValue: createMock<LtiToolRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(LtiToolUc);
		ltiToolRepo = module.get(LtiToolRepo);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	function setup() {
		const user: User = userFactory.buildWithId();
		const currentUser: ICurrentUser = { userId: user.id } as ICurrentUser;
		const toolId = 'toolId';
		const ltiToolName = 'ltiToolName';
		const query: Partial<LtiToolDO> = {
			id: toolId,
			name: ltiToolName,
		};
		const options: IFindOptions<LtiToolDO> = {
			order: {
				id: SortOrder.asc,
				name: SortOrder.asc,
			},
			pagination: {
				limit: 2,
				skip: 1,
			},
		};
		const ltiToolDO = new LtiToolDO({
			id: toolId,
			name: ltiToolName,
			key: 'key',
			secret: 'secret',
			roles: [LtiRoleType.ADMINISTRATOR],
			url: 'url',
			customs: [new CustomLtiProperty('key', 'value')],
			isHidden: true,
			isTemplate: false,
			openNewTab: true,
			privacy_permission: LtiPrivacyPermission.ANONYMOUS,
		});
		const page: Page<LtiToolDO> = {
			data: [ltiToolDO],
			total: 1,
		};
		return { user, currentUser, query, options, page, toolId, ltiToolDO };
	}

	describe('findLtiTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, query, options } = setup();

				await uc.findLtiTool(currentUser, query, options);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, query, options, user } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.findLtiTool(currentUser, query, options);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_VIEW]);
			});
		});

		it('should call the ltiToolRepo', async () => {
			const { currentUser, query, options } = setup();

			await uc.findLtiTool(currentUser, query, options);

			expect(ltiToolRepo.find).toHaveBeenCalledWith(query, options);
		});

		it('should return a page of ltiToolDo', async () => {
			const { currentUser, query, options, page } = setup();
			ltiToolRepo.find.mockResolvedValue(page);

			const resultPage: Page<LtiToolDO> = await uc.findLtiTool(currentUser, query, options);

			expect(resultPage).toEqual(page);
		});
	});

	describe('getLtiTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, toolId } = setup();

				await uc.getLtiTool(currentUser, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, toolId, user } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.getLtiTool(currentUser, toolId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_VIEW]);
			});
		});

		it('should call the ltiToolRepo', async () => {
			const { currentUser, toolId } = setup();

			await uc.getLtiTool(currentUser, toolId);

			expect(ltiToolRepo.findById).toHaveBeenCalledWith(toolId);
		});

		it('should return a ltiToolDo', async () => {
			const { currentUser, ltiToolDO, toolId } = setup();
			ltiToolRepo.findById.mockResolvedValue(ltiToolDO);

			const result: LtiToolDO = await uc.getLtiTool(currentUser, toolId);

			expect(result).toEqual(ltiToolDO);
		});
	});

	describe('createLtiTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, ltiToolDO } = setup();

				await uc.createLtiTool(currentUser, ltiToolDO);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, ltiToolDO, user } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.createLtiTool(currentUser, ltiToolDO);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_CREATE]);
			});
		});

		it('should call the ltiToolRepo', async () => {
			const { currentUser, ltiToolDO } = setup();

			await uc.createLtiTool(currentUser, ltiToolDO);

			expect(ltiToolRepo.save).toHaveBeenCalledWith(ltiToolDO);
		});

		it('should return the saved ltiToolDo', async () => {
			const { currentUser, ltiToolDO } = setup();
			ltiToolRepo.save.mockResolvedValue(ltiToolDO);

			const result: LtiToolDO = await uc.createLtiTool(currentUser, ltiToolDO);

			expect(result).toEqual(ltiToolDO);
		});
	});

	describe('updateLtiTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, ltiToolDO, toolId } = setup();

				await uc.updateLtiTool(currentUser, toolId, ltiToolDO);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, user, ltiToolDO, toolId } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.updateLtiTool(currentUser, toolId, ltiToolDO);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_EDIT]);
			});

			it('should call findById method of the ltiToolRepo', async () => {
				const { currentUser, toolId, ltiToolDO } = setup();

				await uc.updateLtiTool(currentUser, toolId, ltiToolDO);

				expect(ltiToolRepo.findById).toHaveBeenCalledWith(toolId);
			});

			it('should call the save method of the ltiToolRepo with updatedDO', async () => {
				const { currentUser, toolId, ltiToolDO } = setup();
				const existingDO: LtiToolDO = new LtiToolDO({
					customs: [new CustomLtiProperty('toUpdate', 'toUpdate')],
					isHidden: false,
					isTemplate: true,
					key: 'toUpdate',
					openNewTab: false,
					privacy_permission: LtiPrivacyPermission.EMAIL,
					roles: [LtiRoleType.MENTOR],
					secret: 'toUpdate',
					url: 'toUpdate',
					name: 'toUpdate',
				});
				ltiToolRepo.findById.mockResolvedValue(existingDO);

				await uc.updateLtiTool(currentUser, toolId, ltiToolDO);

				expect(ltiToolRepo.save).toHaveBeenCalledWith({ ...existingDO, ...ltiToolDO });
			});

			it('should return the updated ltiToolDo', async () => {
				const { currentUser, toolId, ltiToolDO } = setup();
				ltiToolRepo.findById.mockResolvedValue(ltiToolDO);
				ltiToolRepo.save.mockResolvedValue(ltiToolDO);

				const result: LtiToolDO = await uc.updateLtiTool(currentUser, toolId, ltiToolDO);

				expect(result).toEqual(ltiToolDO);
			});
		});
	});

	describe('deleteLtiTool', () => {
		describe('authorizationService', () => {
			it('should call getUserWithPermissions', async () => {
				const { currentUser, toolId } = setup();

				await uc.deleteLtiTool(currentUser, toolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { currentUser, toolId, user } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				await uc.deleteLtiTool(currentUser, toolId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.TOOL_EDIT]);
			});
		});

		it('should call findById method of the ltiToolRepo', async () => {
			const { currentUser, toolId } = setup();

			await uc.deleteLtiTool(currentUser, toolId);

			expect(ltiToolRepo.findById).toHaveBeenCalledWith(toolId);
		});

		it('should call deleteById method of the ltiToolRepo', async () => {
			const { currentUser, toolId } = setup();

			await uc.deleteLtiTool(currentUser, toolId);

			expect(ltiToolRepo.deleteById).toHaveBeenCalledWith(toolId);
		});

		it('should return the deleted ltiToolDO', async () => {
			const { currentUser, toolId, ltiToolDO } = setup();
			ltiToolRepo.findById.mockResolvedValue(ltiToolDO);
			ltiToolRepo.deleteById.mockResolvedValue(Promise.resolve());

			const deletedDO: LtiToolDO = await uc.deleteLtiTool(currentUser, toolId);

			expect(deletedDO).toEqual(ltiToolDO);
		});
	});
});
