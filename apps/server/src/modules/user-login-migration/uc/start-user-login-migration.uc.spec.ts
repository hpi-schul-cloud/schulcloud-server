import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, LegacySchoolDo, User, UserLoginMigrationDO } from '@shared/domain';
import { legacySchoolDoFactory, setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { SchoolNumberMissingLoggableException, UserLoginMigrationAlreadyClosedLoggableException } from '../error';
import { UserLoginMigrationService } from '../service';
import { StartUserLoginMigrationUc } from './start-user-login-migration.uc';

describe('StartUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: StartUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				StartUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(StartUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(LegacySchoolService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('startMigration', () => {
		describe('when an admin starts a new migration', () => {
			const setup = () => {
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
				userLoginMigrationService.startMigration.mockResolvedValueOnce(migration);

				return { user, school, migration };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.startMigration('userId', 'schoolId');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to start a new migration', async () => {
				setup();

				await uc.startMigration('userId', 'schoolId');

				expect(userLoginMigrationService.startMigration).toHaveBeenCalledWith('schoolId');
			});

			it('should return a UserLoginMigration', async () => {
				const { migration } = setup();

				const result: UserLoginMigrationDO = await uc.startMigration('userId', 'schoolId');

				expect(result).toEqual(migration);
			});
		});

		describe('when an admin starts an existing migration', () => {
			const setup = () => {
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);

				return { user, school, migration };
			};

			it('should not call the service to start a new migration', async () => {
				setup();

				await uc.startMigration('userId', 'schoolId');

				expect(userLoginMigrationService.startMigration).not.toHaveBeenCalled();
			});

			it('should return a UserLoginMigration', async () => {
				const { migration } = setup();

				const result: UserLoginMigrationDO = await uc.startMigration('userId', 'schoolId');

				expect(result).toEqual(migration);
			});
		});

		describe('when the user does not have enough permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
			};

			it('should throw an exception', async () => {
				setup();

				const func = async () => uc.startMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when the school has no school number', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ officialSchoolNumber: undefined });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
			};

			it('should throw a SchoolNumberMissingLoggableException', async () => {
				setup();

				const func = async () => uc.startMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(SchoolNumberMissingLoggableException);
			});
		});

		describe('when the the migration is already closed', () => {
			const setup = () => {
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
			};

			it('should throw a UserLoginMigrationAlreadyClosedLoggableException', async () => {
				setup();

				const func = async () => uc.startMigration('userId', 'schoolId');

				await expect(func).rejects.toThrow(UserLoginMigrationAlreadyClosedLoggableException);
			});
		});
	});
});
