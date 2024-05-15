import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Account, AccountService } from '@modules/account';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { accountDoFactory, userDoFactory, userLoginMigrationDOFactory } from '@shared/testing/factory';
import { Logger } from '@src/core/logger';
import {
	UserLoginMigrationNotFoundLoggableException,
	UserMigrationRollbackSuccessfulLoggable,
	UserNotMigratedLoggableException,
} from '../loggable';
import { UserLoginMigrationRollbackService } from './user-login-migration-rollback.service';
import { UserLoginMigrationService } from './user-login-migration.service';

describe(UserLoginMigrationRollbackService.name, () => {
	let module: TestingModule;
	let service: UserLoginMigrationRollbackService;

	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLoginMigrationRollbackService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(UserLoginMigrationRollbackService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('rollbackUser', () => {
		describe('when an ldap user is rolled back during a migration', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.build({
					id: userId,
					externalId: 'externalId',
					previousExternalId: 'previousExternalId',
					lastLoginSystemChange: new Date(),
				});
				const account = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: user.schoolId,
					sourceSystemId: new ObjectId().toHexString(),
					closedAt: undefined,
					finishedAt: undefined,
				});

				userService.findById.mockResolvedValueOnce(new UserDO(user));
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(account.getProps()));
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);

				return {
					userId,
					user,
					account,
					userLoginMigration,
				};
			};

			it('should roll back and save the user', async () => {
				const { userId, user } = setup();

				await service.rollbackUser(userId);

				expect(userService.save).toHaveBeenCalledWith<[UserDO]>(
					new UserDO({
						...user,
						externalId: user.previousExternalId,
						previousExternalId: undefined,
						lastLoginSystemChange: undefined,
						outdatedSince: undefined,
					})
				);
			});

			it('should roll back and save the account', async () => {
				const { userId, account, userLoginMigration } = setup();

				await service.rollbackUser(userId);

				expect(accountService.save).toHaveBeenCalledWith<[Account]>(
					new Account({ ...account.getProps(), systemId: userLoginMigration.sourceSystemId })
				);
			});

			it('should log a success message', async () => {
				const { userId, user, userLoginMigration } = setup();

				await service.rollbackUser(userId);

				expect(logger.info).toHaveBeenCalledWith(
					new UserMigrationRollbackSuccessfulLoggable(user.id, user.externalId, userLoginMigration.id)
				);
			});
		});

		describe('when a local user is rolled back during a migration', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.build({
					id: userId,
					externalId: 'externalId',
					previousExternalId: undefined,
					lastLoginSystemChange: new Date(),
				});
				const account = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: user.schoolId,
					sourceSystemId: undefined,
					closedAt: undefined,
					finishedAt: undefined,
				});

				userService.findById.mockResolvedValueOnce(new UserDO(user));
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(account.getProps()));
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);

				return {
					userId,
					user,
					account,
					userLoginMigration,
				};
			};

			it('should save the user without an externalId', async () => {
				const { userId, user } = setup();

				await service.rollbackUser(userId);

				expect(userService.save).toHaveBeenCalledWith<[UserDO]>(
					new UserDO({
						...user,
						externalId: undefined,
						previousExternalId: undefined,
						lastLoginSystemChange: undefined,
						outdatedSince: undefined,
					})
				);
			});

			it('should save the account without a systemId', async () => {
				const { userId, account } = setup();

				await service.rollbackUser(userId);

				expect(accountService.save).toHaveBeenCalledWith<[Account]>(
					new Account({ ...account.getProps(), systemId: undefined })
				);
			});
		});

		describe('when a user is rolled back after a migration was closed', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.build({
					id: userId,
					externalId: 'externalId',
					previousExternalId: 'previousExternalId',
					lastLoginSystemChange: new Date(),
				});
				const account = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: user.schoolId,
					sourceSystemId: new ObjectId().toHexString(),
					closedAt: new Date(),
					finishedAt: new Date(),
				});

				userService.findById.mockResolvedValueOnce(new UserDO(user));
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(account.getProps()));
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);

				return {
					userId,
					user,
					account,
					userLoginMigration,
				};
			};

			it('should mark the user as outdated', async () => {
				const { userId, user, userLoginMigration } = setup();

				await service.rollbackUser(userId);

				expect(userService.save).toHaveBeenCalledWith<[UserDO]>(
					new UserDO({
						...user,
						externalId: user.previousExternalId,
						previousExternalId: undefined,
						lastLoginSystemChange: undefined,
						outdatedSince: userLoginMigration.closedAt,
					})
				);
			});
		});

		describe('when a user has not migrated yet', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.build({
					id: userId,
					externalId: 'externalId',
					lastLoginSystemChange: undefined,
				});
				const account = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId({
					schoolId: user.schoolId,
				});

				userService.findById.mockResolvedValueOnce(new UserDO(user));
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(account.getProps()));
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);

				return {
					userId,
					user,
					account,
					userLoginMigration,
				};
			};

			it('should throw UserNotMigratedLoggableException', async () => {
				const { userId } = setup();

				await expect(service.rollbackUser(userId)).rejects.toThrow(UserNotMigratedLoggableException);
			});
		});

		describe("when a user's school is not migrating", () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const user = userDoFactory.build({
					id: userId,
					externalId: 'externalId',
					lastLoginSystemChange: undefined,
				});
				const account = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});

				userService.findById.mockResolvedValueOnce(new UserDO(user));
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(account.getProps()));
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);

				return {
					userId,
					user,
					account,
				};
			};

			it('should throw UserLoginMigrationNotFoundLoggableException', async () => {
				const { userId } = setup();

				await expect(service.rollbackUser(userId)).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});
	});
});
