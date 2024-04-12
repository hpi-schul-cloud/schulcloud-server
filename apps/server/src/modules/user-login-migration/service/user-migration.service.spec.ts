import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService, Account } from '@modules/account';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { roleFactory, setupEntities, userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { UserMigrationDatabaseOperationFailedLoggableException } from '../loggable';
import { MultipleUsersFoundLoggableException } from '../loggable/user-is-already-migrated.loggable-exception';
import { UserMigrationService } from './user-migration.service';

describe(UserMigrationService.name, () => {
	let module: TestingModule;
	let service: UserMigrationService;

	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserMigrationService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(UserMigrationService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		logger = module.get(Logger);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('migrateUser', () => {
		const mockDate = new Date(2020, 1, 1);

		beforeAll(() => {
			jest.useFakeTimers();
			jest.setSystemTime(mockDate);
		});

		describe('when migrate user was successful', () => {
			const setup = () => {
				const targetSystemId = new ObjectId().toHexString();

				const role = roleFactory.buildWithId();
				const userId = new ObjectId().toHexString();
				const targetExternalId = 'newUserExternalId';
				const sourceExternalId = 'currentUserExternalId';
				const user: UserDO = userDoFactory.buildWithId({
					id: userId,
					createdAt: mockDate,
					updatedAt: mockDate,
					email: 'emailMock',
					firstName: 'firstNameMock',
					lastName: 'lastNameMock',
					schoolId: 'schoolMock',
					roles: [role],
					externalId: sourceExternalId,
				});

				const accountId = new ObjectId().toHexString();
				const sourceSystemId = new ObjectId().toHexString();
				const accountDto: Account = new Account({
					id: accountId,
					updatedAt: new Date(),
					createdAt: new Date(),
					userId,
					username: '',
					systemId: sourceSystemId,
				});

				userService.findById.mockResolvedValueOnce({ ...user });
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(accountDto.getProps()));

				return {
					user,
					userId,
					targetExternalId,
					sourceExternalId,
					accountDto,
					sourceSystemId,
					targetSystemId,
				};
			};

			it('should use the correct user', async () => {
				const { userId, targetExternalId, targetSystemId } = setup();

				await service.migrateUser(userId, targetExternalId, targetSystemId);

				expect(userService.findById).toHaveBeenCalledWith(userId);
			});

			it('should use the correct account', async () => {
				const { userId, targetExternalId, targetSystemId } = setup();

				await service.migrateUser(userId, targetExternalId, targetSystemId);

				expect(accountService.findByUserIdOrFail).toHaveBeenCalledWith(userId);
			});

			it('should save the migrated user', async () => {
				const { userId, targetExternalId, targetSystemId, user, sourceExternalId } = setup();

				await service.migrateUser(userId, targetExternalId, targetSystemId);

				expect(userService.save).toHaveBeenCalledWith({
					...user,
					externalId: targetExternalId,
					previousExternalId: sourceExternalId,
					lastLoginSystemChange: mockDate,
				});
			});

			it('should save the migrated account', async () => {
				const { userId, targetExternalId, targetSystemId, accountDto } = setup();

				await service.migrateUser(userId, targetExternalId, targetSystemId);

				expect(accountService.save).toHaveBeenCalledWith(
					new Account({
						...accountDto.getProps(),
						systemId: targetSystemId,
					})
				);
			});
		});

		describe('when saving to the database fails', () => {
			const setup = () => {
				const targetSystemId = new ObjectId().toHexString();

				const role = roleFactory.buildWithId();
				const userId = new ObjectId().toHexString();
				const targetExternalId = 'newUserExternalId';
				const sourceExternalId = 'currentUserExternalId';
				const user: UserDO = userDoFactory.buildWithId({
					id: userId,
					createdAt: mockDate,
					updatedAt: mockDate,
					email: 'emailMock',
					firstName: 'firstNameMock',
					lastName: 'lastNameMock',
					schoolId: 'schoolMock',
					roles: [role],
					externalId: sourceExternalId,
				});

				const accountId = new ObjectId().toHexString();
				const sourceSystemId = new ObjectId().toHexString();
				const accountDto: Account = new Account({
					id: accountId,
					updatedAt: new Date(),
					createdAt: new Date(),
					userId,
					username: '',
					systemId: sourceSystemId,
				});

				const error = new Error('Cannot save');

				userService.findById.mockResolvedValueOnce({ ...user });
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(accountDto.getProps()));

				userService.save.mockRejectedValueOnce(error);
				accountService.save.mockRejectedValueOnce(error);

				return {
					user,
					userId,
					targetExternalId,
					sourceExternalId,
					accountDto,
					sourceSystemId,
					targetSystemId,
					error,
				};
			};

			it('should roll back possible changes to the user', async () => {
				const { userId, targetExternalId, targetSystemId, user } = setup();

				await expect(service.migrateUser(userId, targetExternalId, targetSystemId)).rejects.toThrow();

				expect(userService.save).toHaveBeenLastCalledWith(user);
			});

			it('should roll back possible changes to the account', async () => {
				const { userId, targetExternalId, targetSystemId, accountDto } = setup();

				await expect(service.migrateUser(userId, targetExternalId, targetSystemId)).rejects.toThrow();

				expect(accountService.save).toHaveBeenLastCalledWith(accountDto);
			});

			it('should log a rollback error', async () => {
				const { userId, targetExternalId, targetSystemId, error } = setup();

				await expect(service.migrateUser(userId, targetExternalId, targetSystemId)).rejects.toThrow();

				expect(logger.warning).toHaveBeenCalledWith(
					new UserMigrationDatabaseOperationFailedLoggableException(userId, 'rollback', error)
				);
			});

			it('should throw an error', async () => {
				const { userId, targetExternalId, targetSystemId, error } = setup();

				await expect(service.migrateUser(userId, targetExternalId, targetSystemId)).rejects.toThrow(
					new UserMigrationDatabaseOperationFailedLoggableException(userId, 'migration', error)
				);
			});
		});

		describe('when user is already migrated', () => {
			const setup = () => {
				const targetSystemId = new ObjectId().toHexString();

				const role = roleFactory.buildWithId();
				const userId = new ObjectId().toHexString();
				const targetExternalId = 'newUserExternalId';
				const sourceExternalId = 'currentUserExternalId';
				const user: UserDO = userDoFactory.buildWithId({
					id: userId,
					createdAt: mockDate,
					updatedAt: mockDate,
					email: 'emailMock',
					firstName: 'firstNameMock',
					lastName: 'lastNameMock',
					schoolId: 'schoolMock',
					roles: [role],
					externalId: sourceExternalId,
				});

				const accountId = new ObjectId().toHexString();
				const sourceSystemId = new ObjectId().toHexString();
				const accountDto: Account = new Account({
					id: accountId,
					updatedAt: new Date(),
					createdAt: new Date(),
					userId,
					username: '',
					systemId: sourceSystemId,
				});

				userService.findByExternalId.mockRejectedValueOnce(new MultipleUsersFoundLoggableException());
				userService.findById.mockResolvedValueOnce({ ...user });
				accountService.findByUserIdOrFail.mockResolvedValueOnce(new Account(accountDto.getProps()));

				return {
					user,
					userId,
					targetExternalId,
					sourceExternalId,
					accountDto,
					sourceSystemId,
					targetSystemId,
				};
			};

			it('should throw an error', async () => {
				const { userId, targetExternalId, targetSystemId } = setup();

				await expect(service.migrateUser(userId, targetExternalId, targetSystemId)).rejects.toThrow(
					new MultipleUsersFoundLoggableException()
				);
			});
		});
	});
});
