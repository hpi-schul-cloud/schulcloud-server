import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenOperationError } from '@shared/common';
import { ICurrentUser, LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { accountFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountService } from '@src/modules/authentication/services/account.service';
import { AuthorizationService } from '@src/modules/authorization';
import { UserUC } from './user.uc';

describe('UserUc', () => {
	let service: UserUC;
	let userRepo: DeepMocked<UserRepo>;
	let permissionService: DeepMocked<PermissionService>;
	let orm: MikroORM;
	let config: DeepMocked<ConfigService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let accountService: DeepMocked<AccountService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserUC,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: PermissionService,
					useValue: createMock<PermissionService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
			],
		}).compile();

		service = module.get(UserUC);
		userRepo = module.get(UserRepo);
		permissionService = module.get(PermissionService);
		config = module.get(ConfigService);
		authorizationService = module.get(AuthorizationService);
		accountService = module.get(AccountService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('me', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
		});

		afterEach(() => {
			userRepo.findById.mockRestore();
			permissionService.resolvePermissions.mockRestore();
		});

		it('should provide information about the passed userId', async () => {
			await service.me(user.id);

			expect(userRepo.findById).toHaveBeenCalled();
			expect(permissionService.resolvePermissions).toHaveBeenCalledWith(user);
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
			userRepo.save.mockResolvedValue();
			config.get.mockReturnValue(['de']);
		});

		afterEach(() => {
			userRepo.findById.mockRestore();
			userRepo.save.mockRestore();
		});

		it('should patch language auf passed userId', async () => {
			await service.patchLanguage(user.id, { language: LanguageType.DE });

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(service.patchLanguage(user.id, { language: LanguageType.EN })).rejects.toThrowError();
		});
	});

	describe('findAccountByUserId', () => {
		let mockCurrentUser: User;
		let mockTargetUser: User;

		beforeEach(() => {
			authorizationService.hasPermission = jest.fn().mockReturnValue(true); // is fully tested in user.role.spec.ts
			mockCurrentUser = userFactory.buildWithId();
			mockTargetUser = userFactory.buildWithId();
		});

		afterEach(() => {
			userRepo.findById.mockRestore();
		});

		it('should throw, if the current user has no permission', async () => {
			authorizationService.hasPermission.mockReturnValue(false);

			await expect(
				service.findAccountByUserId({ userId: mockCurrentUser.id } as ICurrentUser, mockTargetUser.id)
			).rejects.toThrow(ForbiddenOperationError);
		});

		it('should return an account, if the current has the permission', async () => {
			const mockTargetUserAccount = accountFactory.buildWithId({ user: mockTargetUser });

			accountService.findByUserId.mockResolvedValue({
				id: mockTargetUserAccount.id,
				username: mockTargetUserAccount.username,
				userId: mockTargetUserAccount.user.id,
				activated: mockTargetUserAccount.activated ?? false,
				createdAt: mockTargetUserAccount.createdAt,
				updatedAt: mockTargetUserAccount.updatedAt,
			});

			const account = await service.findAccountByUserId(
				{ userId: mockCurrentUser.id } as ICurrentUser,
				mockTargetUser.id
			);

			expect(account).toStrictEqual(
				expect.objectContaining({
					id: mockTargetUserAccount.id,
					username: mockTargetUserAccount.username,
					userId: mockTargetUserAccount.user.id,
					activated: mockTargetUserAccount.activated ?? false,
				})
			);
		});
		it('should return null, if the target user has no account', async () => {
			accountService.findByUserId.mockResolvedValue(null);

			const account = await service.findAccountByUserId(
				{ userId: mockCurrentUser.id } as ICurrentUser,
				mockTargetUser.id
			);

			expect(account).toBe(null);
		});
	});
});
