import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from '@src/modules/school';
import { SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { userLoginMigrationDOFactory } from '@shared/testing/factory/domainobject/user-login-migration-do.factory';
import { StartUserLoginMigrationValidationService } from './start-user-login-migration-validation.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { UserLoginMigrationLoggableException } from '../error';

describe('StartUserLoginMigrationValidationService', () => {
	let module: TestingModule;
	let service: StartUserLoginMigrationValidationService;

	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;
	let commonUserLoginMigrationService: DeepMocked<CommonUserLoginMigrationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				StartUserLoginMigrationValidationService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: CommonUserLoginMigrationService,
					useValue: createMock<CommonUserLoginMigrationService>(),
				},
			],
		}).compile();

		service = module.get(StartUserLoginMigrationValidationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
		commonUserLoginMigrationService = module.get(CommonUserLoginMigrationService);
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

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				schoolService.getSchoolById.mockResolvedValue(school);
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(null);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should call ensurePermission', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(commonUserLoginMigrationService.ensurePermission).toHaveBeenCalledWith(userId, schoolId);
			});

			it('should get school by id ', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolId);
			});

			it('should check if migration exists', async () => {
				const { userId, schoolId } = setup();

				await service.checkPreconditions(userId, schoolId);

				expect(commonUserLoginMigrationService.findExistingUserLoginMigration).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when school has no officialSchoolNumber', () => {
			const setup = () => {
				const school: SchoolDO = schoolDOFactory.buildWithId();
				school.officialSchoolNumber = undefined;

				const user: User = userFactory.buildWithId();

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(null);

				return { user, migration, schoolId: school.id as string };
			};

			it('should throw UserLoginMigrationLoggableException ', async () => {
				const { schoolId, user } = setup();

				const func = () => service.checkPreconditions(user.id, schoolId);

				await expect(func()).rejects.toThrow(
					new UserLoginMigrationLoggableException(`The school with schoolId ${schoolId} has no official school number.`)
				);
			});
		});

		describe('when migration has already finished', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
					closedAt: new Date(),
					finishedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.schoolId });

				authorizationService.checkPermission.mockReturnThis();
				schoolService.getSchoolById.mockResolvedValue(school);
				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration };
			};

			it('should throw UserLoginMigrationLoggableException ', async () => {
				const { userId, migration } = setup();

				const func = () => service.checkPreconditions(userId, migration.schoolId);

				await expect(func()).rejects.toThrow(
					new UserLoginMigrationLoggableException(
						`The school with schoolId ${migration.schoolId} already finished the migration.`
					)
				);
			});
		});

		describe('when migration has already started', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();

				authorizationService.checkPermission.mockReturnThis();
				commonUserLoginMigrationService.ensurePermission.mockResolvedValue();
				schoolService.getSchoolById.mockResolvedValue(school);
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

				return { userId, migration };
			};

			it('should throw UserLoginMigrationLoggableException ', async () => {
				const { userId, migration } = setup();

				const func = () => service.checkPreconditions(userId, migration.schoolId);

				await expect(func()).rejects.toThrow(
					new UserLoginMigrationLoggableException(
						`The school with schoolId ${migration.schoolId} already started the migration.`
					)
				);
			});
		});
	});
});
