import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory } from '@shared/testing/factory';
import { UserLoginMigrationRollbackService } from '../service';
import { UserLoginMigrationRollbackUc } from './user-login-migration-rollback.uc';

describe(UserLoginMigrationRollbackUc.name, () => {
	let module: TestingModule;
	let uc: UserLoginMigrationRollbackUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let userLoginMigrationRollbackService: DeepMocked<UserLoginMigrationRollbackService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRollbackUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: UserLoginMigrationRollbackService,
					useValue: createMock<UserLoginMigrationRollbackService>(),
				},
			],
		}).compile();

		uc = module.get(UserLoginMigrationRollbackUc);
		authorizationService = module.get(AuthorizationService);
		userLoginMigrationRollbackService = module.get(UserLoginMigrationRollbackService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('rollbackUser', () => {
		describe('when a user is rolled back', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const targetUserId = new ObjectId().toHexString();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					targetUserId,
				};
			};

			it('should check the permission', async () => {
				const { user, targetUserId } = setup();

				await uc.rollbackUser(user.id, targetUserId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [
					Permission.USER_LOGIN_MIGRATION_ROLLBACK,
				]);
			});

			it('should rollback a user', async () => {
				const { user, targetUserId } = setup();

				await uc.rollbackUser(user.id, targetUserId);

				expect(userLoginMigrationRollbackService.rollbackUser).toHaveBeenCalledWith(targetUserId);
			});
		});

		describe('when the authorization fails', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const targetUserId = new ObjectId().toHexString();
				const error = new Error();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					targetUserId,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, targetUserId, error } = setup();

				await expect(uc.rollbackUser(user.id, targetUserId)).rejects.toThrow(error);
			});

			it('should not rollback a user', async () => {
				const { user, targetUserId } = setup();

				await expect(uc.rollbackUser(user.id, targetUserId)).rejects.toThrow();

				expect(userLoginMigrationRollbackService.rollbackUser).not.toHaveBeenCalled();
			});
		});
	});
});
