import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LegacySchoolService } from '@modules/legacy-school';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLoginMigrationRepo } from '../../repo';
import { UserLoginMigrationDO } from '../do';
import { MigrationCheckService } from './migration-check.service';

describe('MigrationCheckService', () => {
	let module: TestingModule;
	let service: MigrationCheckService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<LegacySchoolService>;
	let userLoginMigrationRepo: DeepMocked<UserLoginMigrationRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MigrationCheckService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
				{
					provide: UserLoginMigrationRepo,
					useValue: createMock<UserLoginMigrationRepo>(),
				},
			],
		}).compile();

		service = module.get(MigrationCheckService);
		userService = module.get(UserService);
		schoolService = module.get(LegacySchoolService);
		userLoginMigrationRepo = module.get(UserLoginMigrationRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('shouldUserMigrate', () => {
		describe('when no school with the official school number was found', () => {
			const setup = () => {
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);
				userService.findByExternalId.mockResolvedValue(null);
			};

			it('should return false', async () => {
				setup();

				const result = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});

		describe('when a non-migrating school was found', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const user = userDoFactory.buildWithId();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(null);
			};

			it('should return false', async () => {
				setup();

				const result = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});

		describe('when a migrating school was found but no user', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const userLoginMigration = new UserLoginMigrationDO({
					schoolId: school.id as string,
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-03-03'),
				});

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(null);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
			};

			it('should return true', async () => {
				setup();

				const result = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(true);
			});
		});

		describe('when a migrating school and a user that has not migrated were found', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const user = userDoFactory.buildWithId({ lastLoginSystemChange: undefined });
				const userLoginMigration = new UserLoginMigrationDO({
					schoolId: school.id as string,
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-03-03'),
				});
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
			};

			it('should return true', async () => {
				setup();

				const result = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(true);
			});
		});

		describe('when a migrating school and a user that has migrated were found', () => {
			const setup = () => {
				const school = legacySchoolDoFactory.buildWithId();
				const user = userDoFactory.buildWithId({ lastLoginSystemChange: new Date('2023-03-04') });
				const userLoginMigration = new UserLoginMigrationDO({
					schoolId: school.id as string,
					targetSystemId: 'targetSystemId',
					startedAt: new Date('2023-03-03'),
				});
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);
				userLoginMigrationRepo.findBySchoolId.mockResolvedValue(userLoginMigration);
			};

			it('should return false', async () => {
				setup();

				const result = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});
	});
});
