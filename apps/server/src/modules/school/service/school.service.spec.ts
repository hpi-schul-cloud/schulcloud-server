import { SchoolFeatures } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolService } from './school.service';
import { MigrationResponse } from '../controller/dto';

describe('SchoolService', () => {
	let module: TestingModule;
	let schoolService: SchoolService;
	let orm: MikroORM;

	let schoolRepo: DeepMocked<SchoolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolService,
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: SchoolMapper,
					useValue: createMock<SchoolMapper>(),
				},
			],
		}).compile();
		schoolRepo = module.get(SchoolRepo);
		schoolService = module.get(SchoolService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	const setup = () => {
		const systems: string[] = ['systemId'];
		const schoolSaved: SchoolDO = new SchoolDO({
			id: 'testId',
			name: 'schoolName',
			externalId: 'externalId',
			officialSchoolNumber: '9999',
			systems,
			features: [SchoolFeatures.VIDEOCONFERENCE],
		});
		const schoolUnsaved: SchoolDO = new SchoolDO({ name: 'school #2}', systems: [] });
		schoolRepo.findById.mockResolvedValue(schoolSaved);
		schoolRepo.findByExternalId.mockResolvedValue(schoolSaved);
		schoolRepo.findBySchoolNumber.mockResolvedValue(schoolSaved);
		const schoolSavedId = schoolSaved.id as string;
		const schoolSavedExternalId = schoolSaved.externalId as string;
		const schoolSavedNumber = schoolSaved.officialSchoolNumber as string;
		return {
			schoolSaved,
			schoolSavedId,
			schoolSavedExternalId,
			schoolSavedNumber,
			systems,
			schoolUnsaved,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('saveProvisioningSchoolOutputDto', () => {
		let schoolServiceSpy: jest.SpyInstance;
		let provisioningDto: ProvisioningSchoolOutputDto;
		let returnDO: SchoolDO;
		beforeAll(() => {
			provisioningDto = new ProvisioningSchoolOutputDto({
				name: 'test',
				externalId: 'externalTest',
				systemIds: [],
			});
			returnDO = new SchoolDO({
				name: 'test',
			});
			schoolServiceSpy = jest.spyOn(schoolService, 'createOrUpdateSchool').mockResolvedValue(returnDO);
		});
		afterAll(() => {
			schoolServiceSpy.mockRestore();
		});
		it('should call the createOrUpdateService', async () => {
			const ret = await schoolService.saveProvisioningSchoolOutputDto(provisioningDto);
			expect(ret).toBe(returnDO);
			expect(schoolServiceSpy).toHaveBeenCalled();
		});
	});

	describe('createOrUpdate', () => {
		it('should create new school', async () => {
			const { schoolUnsaved } = setup();

			await schoolService.createOrUpdateSchool(schoolUnsaved);

			expect(schoolRepo.save).toHaveBeenCalledWith(schoolUnsaved);
		});

		it('should call the repo when update existing school', async () => {
			const { schoolSaved } = setup();

			await schoolService.createOrUpdateSchool(schoolSaved);

			expect(schoolRepo.findById).toHaveBeenCalledWith(schoolSaved.id);
		});

		it('should update existing school', async () => {
			const { schoolSaved, schoolSavedId } = setup();
			schoolSaved.name = 'loadedSchool';
			schoolRepo.findById.mockResolvedValue(schoolSaved);
			await schoolService.createOrUpdateSchool(schoolSaved);

			expect(schoolRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'loadedSchool',
					id: schoolSavedId,
				})
			);
		});
	});

	describe('hasFeature', () => {
		it('should return true', async () => {
			const { schoolSavedId } = setup();

			const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(true);
		});

		it('should return false', async () => {
			const { schoolSaved, schoolSavedId } = setup();
			schoolSaved.features = [];
			schoolRepo.findById.mockResolvedValue(schoolSaved);

			const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

			expect(result).toBe(false);
		});
	});

	describe('getSchoolById', () => {
		it('should call the repo', async () => {
			const { schoolSavedId } = setup();

			await schoolService.getSchoolById(schoolSavedId);

			expect(schoolRepo.findById).toHaveBeenCalledWith(schoolSavedId);
		});

		it('should return a do', async () => {
			const { schoolSavedId } = setup();

			const schoolDO: SchoolDO = await schoolService.getSchoolById(schoolSavedId);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
	});

	describe('getSchoolByExternalId', () => {
		it('should call the repo', async () => {
			const { schoolSavedExternalId, systems } = setup();

			await schoolService.getSchoolByExternalId(schoolSavedExternalId, systems[0]);

			expect(schoolRepo.findByExternalId).toHaveBeenCalledWith(schoolSavedExternalId, systems[0]);
		});

		it('should return a do', async () => {
			const { schoolSavedExternalId, systems } = setup();

			const schoolDO: SchoolDO | null = await schoolService.getSchoolByExternalId(schoolSavedExternalId, systems[0]);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
		it('should return null', async () => {
			const { systems } = setup();

			schoolRepo.findByExternalId.mockResolvedValue(null);

			const schoolDO: SchoolDO | null = await schoolService.getSchoolByExternalId('null', systems[0]);

			expect(schoolDO).toBeNull();
		});
	});

	describe('getSchoolBySchoolNumber', () => {
		it('should call the repo', async () => {
			const { schoolSavedNumber } = setup();

			await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolRepo.findBySchoolNumber).toHaveBeenCalledWith(schoolSavedNumber);
		});

		it('should return a do', async () => {
			const { schoolSavedNumber } = setup();

			const schoolDO: SchoolDO | null = await schoolService.getSchoolBySchoolNumber(schoolSavedNumber);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
		it('should return null', async () => {
			schoolRepo.findBySchoolNumber.mockResolvedValue(null);

			const schoolDO: SchoolDO | null = await schoolService.getSchoolBySchoolNumber('null');

			expect(schoolDO).toBeNull();
		});
	});

	describe('save', () => {
		it('should call the repo', async () => {
			const school: SchoolDO = new SchoolDO({ id: 'id', name: 'name' });

			await schoolService.save(school);

			expect(schoolRepo.save).toHaveBeenCalledWith(school);
		});

		it('should return a do', async () => {
			const school: SchoolDO = new SchoolDO({ id: 'id', name: 'name' });
			schoolRepo.save.mockResolvedValue(school);

			const schoolDO: SchoolDO = await schoolService.save(school);

			expect(schoolDO).toBeInstanceOf(SchoolDO);
		});
	});

	describe('setMigration', () => {
		let testId: string;
		let testDO: SchoolDO;
		beforeAll(() => {
			testId = 'migration';
			testDO = new SchoolDO({
				id: testId,
				name: 'testDO',
				oauthMigrationPossible: true,
				oauthMigrationMandatory: true,
			});
			schoolRepo.findById.mockResolvedValue(testDO);
			schoolRepo.save.mockResolvedValue(testDO);
		});
		it('it should set the migrationflags', async () => {
			const resp: MigrationResponse = await schoolService.setMigration(testId, true, true);
			expect(resp.oauthMigrationPossible).toBeTruthy();
			expect(resp.oauthMigrationMandatory).toBeTruthy();
			expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
			expect(schoolRepo.save).toHaveBeenCalledWith(testDO);
		});
	});

	describe('getMigration', () => {
		let testId: string;
		let testDO: SchoolDO;
		beforeEach(() => {
			testId = 'migration';
			testDO = new SchoolDO({
				id: testId,
				name: 'testDO',
				oauthMigrationPossible: true,
				oauthMigrationMandatory: true,
			});
			schoolRepo.findById.mockResolvedValue(testDO);
		});
		it('it should get the migrationflags', async () => {
			const resp: MigrationResponse = await schoolService.getMigration(testId);
			expect(resp.oauthMigrationPossible).toBeTruthy();
			expect(resp.oauthMigrationMandatory).toBeTruthy();
			expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
		});
		it('it should get the migrationflags when not set', async () => {
			testDO.oauthMigrationPossible = undefined;
			testDO.oauthMigrationMandatory = undefined;
			const resp: MigrationResponse = await schoolService.getMigration(testId);
			expect(resp.oauthMigrationPossible).toBeFalsy();
			expect(resp.oauthMigrationMandatory).toBeFalsy();
			expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
		});
	});
});
