import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolService } from '@src/modules/school';
import { SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { schoolDOFactory } from '@shared/testing';
import { StartUserLoginMigrationError } from '../error';
import { StartUserLoginMigrationValidationService } from './start-user-login-migration-validation.service';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';

describe('StartUserLoginMigrationValidationService', () => {
	let module: TestingModule;
	let service: StartUserLoginMigrationValidationService;

	let schoolService: DeepMocked<SchoolService>;
	let commonUserLoginMigrationService: DeepMocked<CommonUserLoginMigrationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				StartUserLoginMigrationValidationService,
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

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
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
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date(),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId();
				school.officialSchoolNumber = undefined;

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(null);

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

				schoolService.getSchoolById.mockResolvedValue(school);

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

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

				commonUserLoginMigrationService.ensurePermission.mockResolvedValue(Promise.resolve());
				schoolService.getSchoolById.mockResolvedValue(school);
				commonUserLoginMigrationService.findExistingUserLoginMigration.mockResolvedValue(migration);

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
