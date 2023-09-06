import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory, setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import {
	UserLoginMigrationAlreadyClosedLoggableException,
	UserLoginMigrationGracePeriodExpiredLoggableException,
	UserLoginMigrationNotFoundLoggableException,
} from '../error';
import { UserLoginMigrationService } from '../service';
import { ToggleUserLoginMigrationUc } from './toggle-user-login-migration.uc';

describe('ToggleUserLoginMigrationUc', () => {
	let module: TestingModule;
	let uc: ToggleUserLoginMigrationUc;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToggleUserLoginMigrationUc,
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(ToggleUserLoginMigrationUc);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('setMigrationMandatory', () => {
		describe('when an admin sets a migration from optional to mandatory', () => {
			const setup = () => {
				const migrationBeforeMandatory: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();
				const migrationAfterMandatory: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					mandatorySince: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeMandatory);
				userLoginMigrationService.setMigrationMandatory.mockResolvedValueOnce(migrationAfterMandatory);

				return { user, school, migrationAfterMandatory };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.setMigrationMandatory('userId', 'schoolId', true);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to set a migration mandatory', async () => {
				setup();

				await uc.setMigrationMandatory('userId', 'schoolId', true);

				expect(userLoginMigrationService.setMigrationMandatory).toHaveBeenCalledWith('schoolId', true);
			});

			it('should return a UserLoginMigration', async () => {
				const { migrationAfterMandatory } = setup();

				const result: UserLoginMigrationDO = await uc.setMigrationMandatory('userId', 'schoolId', true);

				expect(result).toEqual(migrationAfterMandatory);
			});
		});

		describe('when an admin sets a migration from mandatory to optional', () => {
			const setup = () => {
				const migrationBeforeOptional: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					mandatorySince: new Date(2023, 5),
				});
				const migrationAfterOptional: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migrationBeforeOptional);
				userLoginMigrationService.setMigrationMandatory.mockResolvedValueOnce(migrationAfterOptional);

				return { user, school, migrationAfterOptional };
			};

			it('should check permission', async () => {
				const { user, school } = setup();

				await uc.setMigrationMandatory('userId', 'schoolId', false);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.write([Permission.USER_LOGIN_MIGRATION_ADMIN])
				);
			});

			it('should call the service to set a migration optional', async () => {
				setup();

				await uc.setMigrationMandatory('userId', 'schoolId', false);

				expect(userLoginMigrationService.setMigrationMandatory).toHaveBeenCalledWith('schoolId', false);
			});

			it('should return a UserLoginMigration', async () => {
				const { migrationAfterOptional } = setup();

				const result: UserLoginMigrationDO = await uc.setMigrationMandatory('userId', 'schoolId', false);

				expect(result).toEqual(migrationAfterOptional);
			});
		});

		describe('when the user does not have enough permission', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});
			};

			it('should throw an exception', async () => {
				setup();

				const func = async () => uc.setMigrationMandatory('userId', 'schoolId', true);

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when there is no migration yet', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(null);
			};

			it('should throw a UserLoginMigrationNotFoundLoggableException', async () => {
				setup();

				const func = async () => uc.setMigrationMandatory('userId', 'schoolId', true);

				await expect(func).rejects.toThrow(UserLoginMigrationNotFoundLoggableException);
			});
		});

		describe('when the grace period for restarting a migration has expired', () => {
			const setup = () => {
				jest.useFakeTimers();
				jest.setSystemTime(new Date(2023, 6));

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
					finishedAt: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
			};

			it('should throw a UserLoginMigrationGracePeriodExpiredLoggableException', async () => {
				setup();

				const func = async () => uc.setMigrationMandatory('userId', 'schoolId', true);

				await expect(func).rejects.toThrow(UserLoginMigrationGracePeriodExpiredLoggableException);
			});
		});

		describe('when migration is closed', () => {
			const setup = () => {
				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					closedAt: new Date(2023, 5),
				});

				const user: User = userFactory.buildWithId();

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				userLoginMigrationService.findMigrationBySchool.mockResolvedValueOnce(migration);
			};

			it('should throw a UserLoginMigrationAlreadyClosedLoggableException', async () => {
				setup();

				const func = async () => uc.setMigrationMandatory('userId', 'schoolId', true);

				await expect(func).rejects.toThrow(UserLoginMigrationAlreadyClosedLoggableException);
			});
		});
	});
});
