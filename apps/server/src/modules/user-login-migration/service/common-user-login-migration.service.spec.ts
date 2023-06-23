import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { roleFactory, schoolDOFactory, setupEntities, userFactory, userLoginMigrationDOFactory } from '@shared/testing';
import { Permission, RoleName, SchoolDO, User, UserLoginMigrationDO } from '@shared/domain';
import { Action, AuthorizationContext, AuthorizationService } from '@src/modules/authorization';
import { SchoolService } from '@src/modules/school';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { UserLoginMigrationService } from './user-login-migration.service';
import { ModifyUserLoginMigrationLoggableException } from '../error';

describe('CommonUserLoginMigrationService', () => {
	let module: TestingModule;
	let service: CommonUserLoginMigrationService;

	let authorizationService: DeepMocked<AuthorizationService>;
	let userLoginMigration: DeepMocked<UserLoginMigrationService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				CommonUserLoginMigrationService,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: UserLoginMigrationService,
					useValue: createMock<UserLoginMigrationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(CommonUserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		userLoginMigration = module.get(UserLoginMigrationService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('ensurePermission is called', () => {
		describe('when context, user and school are given ', () => {
			const setup = () => {
				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const school = schoolDOFactory.buildWithId();
				const user: User = userFactory.buildWithId();
				const context: AuthorizationContext = {
					action: Action.write,
					requiredPermissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				};
				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);
				authorizationService.checkPermissionByReferences.mockResolvedValue();

				return {
					user,
					schoolId: school.id as string,
					adminRole,
					context,
					school,
				};
			};

			it('should call getUserWithPermissions', async () => {
				const { user, schoolId } = setup();

				await service.ensurePermission(user.id, schoolId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call getSchoolById', async () => {
				const { user, schoolId } = setup();

				await service.ensurePermission(user.id, schoolId);

				expect(schoolService.getSchoolById).toHaveBeenCalledWith(schoolId);
			});

			it('should call checkPermissionByReferences', async () => {
				const { user, school, context } = setup();

				await service.ensurePermission(user.id, school.id as string);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, school, context);
			});
		});
	});

	describe('findExistingUserLoginMigration is called', () => {
		describe('when context, user and school are given ', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-12-17T03:24:00'),
					finishedAt: new Date('2055-12-17T03:24:00'),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });
				userLoginMigration.findMigrationBySchool.mockResolvedValue(migration);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should call findMigrationBySchool', async () => {
				const { schoolId } = setup();

				await service.findExistingUserLoginMigration(schoolId);

				expect(userLoginMigration.findMigrationBySchool).toHaveBeenCalledWith(schoolId);
			});
		});

		describe('when could not find existing migration', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId({
					schoolId: 'schoolId',
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2022-12-17T03:24:00'),
					closedAt: new Date('2023-12-17T03:24:00'),
					finishedAt: new Date('2055-12-17T03:24:00'),
				});

				const school: SchoolDO = schoolDOFactory.buildWithId({ id: migration.id });
				userLoginMigration.findMigrationBySchool.mockResolvedValue(null);

				return { userId, migration, schoolId: school.id as string };
			};

			it('should return null', async () => {
				const { schoolId } = setup();

				const result = await service.findExistingUserLoginMigration(schoolId);

				expect(result).toEqual(null);
			});
		});
	});

	describe('hasFinishedMigrationOrThrow is called', () => {
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
				return { userId, migration };
			};

			it('should throw ModifyUserLoginMigrationLoggableException ', () => {
				const { migration } = setup();

				expect(() => service.hasNotFinishedMigrationOrThrow(migration)).toThrow(
					new ModifyUserLoginMigrationLoggableException(
						`The school with schoolId ${migration.schoolId} already finished the migration.`,
						migration.schoolId,
						migration.finishedAt
					)
				);
			});
		});
	});
});
