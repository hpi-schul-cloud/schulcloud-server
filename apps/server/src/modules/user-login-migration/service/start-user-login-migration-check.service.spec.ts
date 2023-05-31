import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from '@src/modules/school';
import { Permission, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory, setupEntities, userFactory } from '@shared/testing';
import { Action, AuthorizationService } from '@src/modules/authorization';
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
		await setupEntities();

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

				const context = {
					action: Action.write,
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				};

				authorizationService.checkPermission.mockReturnThis();
				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				schoolService.getSchoolById.mockResolvedValue(school);

				return { userId, migration, schoolId: school.id as string, school, context };
			};

			it('should call checkPermission', async () => {
				const { userId, school, context } = setup();

				await service.checkPreconditions(userId, school.id as string);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(userId, school, context);
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
				const school: SchoolDO = schoolDOFactory.buildWithId();
				school.officialSchoolNumber = undefined;

				const user: User = userFactory.buildWithId();

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				authorizationService.checkPermission.mockReturnThis();
				schoolService.getSchoolById.mockResolvedValue(school);

				userLoginMigrationService.findMigrationBySchool.mockResolvedValue(null);
				userLoginMigrationService.startMigration.mockResolvedValue(migration);

				return { user, migration, schoolId: school.id as string };
			};

			it('should throw ForbiddenException ', async () => {
				const { schoolId, user } = setup();

				await expect(service.checkPreconditions(user.id, schoolId)).rejects.toThrow(
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

				authorizationService.checkPermission.mockReturnThis();
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

				authorizationService.checkPermission.mockReturnThis();
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
