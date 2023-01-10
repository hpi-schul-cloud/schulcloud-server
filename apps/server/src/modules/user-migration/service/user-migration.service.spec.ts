import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '../../system';
import { SystemDto } from '../../system/service/dto/system.dto';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let service: UserMigrationService;

	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserMigrationService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();

		service = module.get(UserMigrationService);
		systemService = module.get(SystemService);
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
		describe('when finding the migration systems', () => {
			it('should return a url to the migration endpoint', async () => {
				const iservSystem: SystemDto = new SystemDto({
					id: 'iservId',
					type: '',
					alias: 'iserv',
				});
				const sanisSystem: SystemDto = new SystemDto({
					id: 'sanisId',
					type: '',
					alias: 'sanis',
				});

				systemService.findOAuth.mockResolvedValue([iservSystem, sanisSystem]);

				const result: string = await service.getMigrationRedirect();

				expect(result).toEqual('/migration?source=iservId&target=sanisId');
			});
		});

		describe('when the migration systems have invalid data', () => {
			it('should throw InternalServerErrorException', async () => {
				systemService.findOAuth.mockResolvedValue([]);

				const promise: Promise<string> = service.getMigrationRedirect();

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});
	});
});
