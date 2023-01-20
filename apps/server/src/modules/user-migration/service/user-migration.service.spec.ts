import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserMigrationService } from './user-migration.service';

describe('UserMigrationService', () => {
	let module: TestingModule;
	let service: UserMigrationService;

	let schoolService: DeepMocked<SchoolService>;
	let systemService: DeepMocked<SystemService>;

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockReturnValue('http://mock.de');

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
		schoolService = module.get(SchoolService);
		systemService = module.get(SystemService);
	});

	afterAll(async () => {
		await module.close();
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

	describe('isSchoolInMigration is called', () => {
		describe('when the migration is possible', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationPossible = new Date();

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);

				const result: boolean = await service.isSchoolInMigration(officialSchoolNumber);

				expect(result).toEqual(true);
			});
		});

		describe('when the migration is mandatory', () => {
			it('should return true', async () => {
				const { school, officialSchoolNumber } = setup();
				school.oauthMigrationMandatory = new Date();

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
				const { school, officialSchoolNumber } = setup();
				const iservSystem: SystemDto = new SystemDto({
					id: 'iservId',
					type: '',
					alias: 'Schulserver',
				});
				const sanisSystem: SystemDto = new SystemDto({
					id: 'sanisId',
					type: '',
					alias: 'SANIS',
				});

				schoolService.getSchoolBySchoolNumber.mockResolvedValue(school);
				systemService.findOAuth.mockResolvedValue([iservSystem, sanisSystem]);

				const result: string = await service.getMigrationRedirect(officialSchoolNumber, 'iservId');

				expect(result).toEqual(
					'http://mock.de/migration?sourceSystem=iservId&targetSystem=sanisId&origin=iservId&mandatory=false'
				);
			});
		});

		describe('when the migration systems have invalid data', () => {
			it('should throw InternalServerErrorException', async () => {
				const { officialSchoolNumber } = setup();
				systemService.findOAuth.mockResolvedValue([]);

				const promise: Promise<string> = service.getMigrationRedirect(officialSchoolNumber, 'unknownSystemId');

				await expect(promise).rejects.toThrow(InternalServerErrorException);
			});
		});
	});
});
