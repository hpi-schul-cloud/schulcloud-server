import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { UserLoginMigrationDO } from '../../domain';
import { UserLoginMigrationNotFoundLoggableException } from '../../domain/loggable';
import {
	SchoolMigrationService,
	UserLoginMigrationRevertService,
	UserLoginMigrationService,
} from '../../domain/service';
import { userLoginMigrationDOFactory } from '../../testing';
import { CloseUserLoginMigrationUc } from './close-user-login-migration.uc';

describe(CloseUserLoginMigrationUc.name, () => {
	let module: TestingModule;
	let uc: CloseUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let schoolMigrationService: DeepMocked<SchoolMigrationService>;
	let userLoginMigrationRevertService: DeepMocked<UserLoginMigrationRevertService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				CloseUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: SchoolMigrationService,
					useValue: createMock<SchoolMigrationService>(),
				},
				{
					provide: UserLoginMigrationRevertService,
					useValue: createMock<UserLoginMigrationRevertService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		uc = module.get(CloseUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		schoolMigrationService = module.get(SchoolMigrationService);
		userLoginMigrationRevertService = module.get(UserLoginMigrationRevertService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('closeMigration', () => {
		describe('when the user login migration was closed after a migration', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: new Date(2023, 1),
				});
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.build({ id: schoolId });

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userLoginMigrationService.closeMigration.mockResolvedValueOnce(closedUserLoginMigration);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(true);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValueOnce(true);

				return {
					user,
					schoolId,
					school,
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should check the permission', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					userLoginMigration,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should close the migration', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationService.closeMigration).toHaveBeenCalledWith(userLoginMigration);
			});

			it('should remove sourceSystem of school', async () => {
				const { user, schoolId, school, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.removeSourceSystemOfSchool).toHaveBeenCalledWith(
					school,
					closedUserLoginMigration
				);
			});

			it('should mark all un-migrated users as outdated', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).toHaveBeenCalledWith(closedUserLoginMigration);
			});

			it('should return the closed user login migration', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toEqual(closedUserLoginMigration);
			});
		});

		describe('when no user login migration exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolId = new ObjectId().toHexString();

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);

				return {
					user,
					schoolId,
				};
			};

			it('should throw a not found exception', async () => {
				const { user, schoolId } = setup();

				const func = () => uc.closeMigration(user.id, schoolId);

				await expect(func).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});

		describe('when the user login migration was closed without any migration', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: new Date(2023, 1),
				});
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.build({ id: schoolId });

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userLoginMigrationService.closeMigration.mockResolvedValueOnce(closedUserLoginMigration);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(false);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValueOnce(false);

				return {
					user,
					schoolId,
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should check the permission', async () => {
				const { user, schoolId, userLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					userLoginMigration,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should revert the start of the migration', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationRevertService.revertUserLoginMigration).toHaveBeenCalledWith(closedUserLoginMigration);
			});

			it('should not remove source system of school', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).not.toHaveBeenCalled();
			});

			it('should not mark all un-migrated users as outdated', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).not.toHaveBeenCalled();
			});

			it('should return undefined', async () => {
				const { user, schoolId } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toBeUndefined();
			});
		});

		describe('when the school was migrated, but all migrated users were deleted', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const userLoginMigration = userLoginMigrationDOFactory.buildWithId();
				const closedUserLoginMigration = new UserLoginMigrationDO({
					...userLoginMigration,
					closedAt: new Date(2023, 1),
				});
				const schoolId = new ObjectId().toHexString();
				const school = legacySchoolDoFactory.build({ id: schoolId });

				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(userLoginMigration);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				userLoginMigrationService.closeMigration.mockResolvedValueOnce(closedUserLoginMigration);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				schoolMigrationService.hasSchoolMigratedInMigrationPhase.mockReturnValueOnce(true);
				schoolMigrationService.hasSchoolMigratedUser.mockResolvedValueOnce(false);

				return {
					user,
					schoolId,
					school,
					userLoginMigration,
					closedUserLoginMigration,
				};
			};

			it('should not revert the start of the migration', async () => {
				const { user, schoolId } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(userLoginMigrationRevertService.revertUserLoginMigration).not.toHaveBeenCalled();
			});

			it('shouldremove sourceSystem of school', async () => {
				const { user, schoolId, school, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.removeSourceSystemOfSchool).toHaveBeenCalledWith(
					school,
					closedUserLoginMigration
				);
			});

			it('should mark all un-migrated users as outdated', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				await uc.closeMigration(user.id, schoolId);

				expect(schoolMigrationService.markUnmigratedUsersAsOutdated).toHaveBeenCalledWith(closedUserLoginMigration);
			});

			it('should return the closed user login migration', async () => {
				const { user, schoolId, closedUserLoginMigration } = setup();

				const result = await uc.closeMigration(user.id, schoolId);

				expect(result).toEqual(closedUserLoginMigration);
			});
		});
	});
});
