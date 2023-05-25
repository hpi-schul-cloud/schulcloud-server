import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { roleFactory, schoolDOFactory, schoolFactory } from '@shared/testing';
import { Permission, RoleName, SchoolDO, UserLoginMigrationDO } from '@shared/domain';
import { Action, AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { CommonUserLoginMigrationService } from './common-user-login-migration.service';
import { UserLoginMigrationService } from './user-login-migration.service';

describe('CommonUserLoginMigrationService', () => {
	let module: TestingModule;
	let service: CommonUserLoginMigrationService;

	let authorizationService: DeepMocked<AuthorizationService>;
	let userLoginMigration: DeepMocked<UserLoginMigrationService>;

	beforeAll(async () => {
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
			],
		}).compile();

		service = module.get(CommonUserLoginMigrationService);
		authorizationService = module.get(AuthorizationService);
		userLoginMigration = module.get(UserLoginMigrationService);
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

				const school = schoolFactory.buildWithId();
				const userId = 'userId';

				authorizationService.checkPermissionByReferences.mockResolvedValue(Promise.resolve());

				return {
					userId,
					schoolId: school.id,
					adminRole,
				};
			};

			it('should call checkPermissionByReferences', async () => {
				const { userId, schoolId } = setup();

				await service.ensurePermission(userId, schoolId);

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
		});
	});

	describe('findExistingUserLoginMigration is called', () => {
		describe('when context, user and school are given ', () => {
			const setup = () => {
				const userId = 'userId';

				const migration: UserLoginMigrationDO = new UserLoginMigrationDO({
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
	});
});
