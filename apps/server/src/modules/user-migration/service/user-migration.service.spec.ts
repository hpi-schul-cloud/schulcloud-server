import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let service: UserMigrationService;

	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(UserMigrationService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('isSchoolInMigration is called', () => {
		describe('when the migration is possible', () => {
			it('should return true', async () => {
				const officialSchoolNumber = '3';
				const school: SchoolDO = new SchoolDO({
					name: 'schoolName',
					officialSchoolNumber,
					oauthMigrationPossible: true,
				});

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when the migration is mandatory', () => {
			it('should return true', async () => {
				const officialSchoolNumber = '3';
				const school: SchoolDO = new SchoolDO({
					name: 'schoolName',
					officialSchoolNumber,
					oauthMigrationMandatory: true,
				});

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when there is no school with this official school number', () => {
			it('should return false', async () => {
				schoolService.getSchoolBySchoolNumber.mockResolvedValue(null);

				const result: boolean = await service.isSchoolInMigration('unknown number');

				expect(result).toEqual(false);
			});
		});
	});

	describe('getMigrationRedirect is called', () => {
		describe('when it is called', () => {
			it('should return a url to the migration endpoint', () => {
				const result: string = service.getMigrationRedirect();

				expect(result).toEqual('/migration');
			});
		});
	});
});
