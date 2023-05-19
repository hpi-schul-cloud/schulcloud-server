import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { MigrationCheckService } from './migration-check.service';

describe('MigrationCheckService', () => {
	let module: TestingModule;
	let service: MigrationCheckService;

	let userService: DeepMocked<UserService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MigrationCheckService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(MigrationCheckService);
		userService = module.get(UserService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('shouldUserMigrate is called', () => {
		describe('when no school with the official school number was found', () => {
			it('should return false', async () => {
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);
				userService.findByExternalId.mockResolvedValue(null);

				const result: boolean = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});

		describe('when a non-migrating school was found', () => {
			it('should return false', async () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ oauthMigrationPossible: undefined });
				const user: UserDO = userDoFactory.buildWithId();
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);

				const result: boolean = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});

		describe('when a migrating school was found but no user', () => {
			it('should return true', async () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ oauthMigrationPossible: new Date('2023-03-03') });
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(null);

				const result: boolean = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(true);
			});
		});

		describe('when a migrating school and a user that has not migrated were found', () => {
			it('should return true', async () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ oauthMigrationPossible: new Date('2023-03-03') });
				const user: UserDO = userDoFactory.buildWithId({ lastLoginSystemChange: undefined });
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);

				const result: boolean = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(true);
			});
		});

		describe('when a migrating school and a user that has migrated were found', () => {
			it('should return false', async () => {
				const school: SchoolDO = schoolDOFactory.buildWithId({ oauthMigrationPossible: new Date('2023-03-03') });
				const user: UserDO = userDoFactory.buildWithId({ lastLoginSystemChange: new Date('2023-03-04') });
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				userService.findByExternalId.mockResolvedValue(user);

				const result: boolean = await service.shouldUserMigrate('externalId', 'systemId', 'officialSchoolNumber');

				expect(result).toEqual(false);
			});
		});
	});
});
