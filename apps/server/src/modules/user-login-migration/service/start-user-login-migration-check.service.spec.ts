import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from '@src/modules/school';
import { Permission, SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { LegacyLogger } from '@src/core/logger';
import { UserLoginMigrationService } from './user-login-migration.service';
import { StartUserLoginMigrationError } from '../error';
import { StartUserLoginMigrationCheckService } from './start-user-login-migration-check.service';

describe('StartUserLoginMigrationCheckService', () => {
	let module: TestingModule;
	let service: StartUserLoginMigrationCheckService;

	let userLoginMigrationService: DeepMocked<UserLoginMigrationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				StartUserLoginMigrationCheckService,
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(StartUserLoginMigrationCheckService);
		userLoginMigrationService = module.get(UserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('checkPreconditions', () => {
		describe('when preconditions are met', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				schoolService.getSchoolById.mockResolvedValue(school);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should call checkPermission', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					userId,
					AllowedAuthorizationEntityType.School,
					schoolId,
					{
						action: Action.write,
						requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
					}
				);
			});

			it('should get school by id ', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolId);
			});

			it('should check if migration exists', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(userLoginMigrationService.findMigrationBySchool).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when school has no officialSchoolNumber', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();
				school.officialSchoolNumber = undefined;

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should throw ForbiddenException ', async () => {
				const { userId, schoolId } = setup();

				await expect(service.checkPreconditions(userId, schoolId)).rejects.toThrow(
					new StartUserLoginMigrationError(`The school with schoolId ${schoolId} has no official school number.`)
				);
			});
		});

		describe('when migration has already finished', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
					closedAt: new Date(),
					finishedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.schoolId });

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(migration);
				schoolService.getSchoolById.mockResolvedValue(school);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration };
			};

			it('should throw StartUserLoginMigrationError ', async () => {
				const { userId, migration } = setup();

				await expect(service.checkPreconditions(userId, migration.schoolId)).rejects.toThrow(
					new StartUserLoginMigrationError(
						`The school with schoolId ${migration.schoolId} already finished the migration.`
					)
				);
			});
		});

		describe('when migration has already started', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());
				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(migration);
				schoolService.getSchoolById.mockResolvedValue(school);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { userId, migration };
			};

			it('should throw StartUserLoginMigrationError ', async () => {
				const { userId, migration } = setup();

				await expect(service.checkPreconditions(userId, migration.schoolId)).rejects.toThrow(
					new StartUserLoginMigrationError(
						`The school with schoolId ${migration.schoolId} already started the migration.`
					)
				);
			});
		});
	});
});
