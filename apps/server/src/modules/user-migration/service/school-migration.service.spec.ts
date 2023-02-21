import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock } from '@golevelup/ts-jest';
import { setupEntities } from '@shared/testing';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import { Logger } from '@src/core/logger';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserMigrationService } from './user-migration.service';
import { SchoolMigrationService } from './school-migration.service';

describe('SchoolMigrationService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: SchoolMigrationService;

	let userService: UserService;
	let schoolService: SchoolService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(UserMigrationService);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	const setup = () => {
		const officialSchoolNumber = '3';
		const school: SchoolDO = new SchoolDO({
			name: 'schoolName',
			officialSchoolNumber,
		});

		return {
			officialSchoolNumber,
			school,
		};
	};

	describe('shouldSchoolMigrate is called', () => {
		// TODO test
	});

	describe('migrateSchool is called', () => {});
});
