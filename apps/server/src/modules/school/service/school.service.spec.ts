import { SchoolFeatures } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolMapper } from '@src/modules/school/mapper/school.mapper';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from './school.service';
import { MigrationResponse } from '../controller/dto';
import { ProvisioningSchoolOutputDto } from '../../provisioning/dto/provisioning-school-output.dto';

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
			systems,
			features: [SchoolFeatures.VIDEOCONFERENCE],
		});
		const schoolUnsaved: SchoolDO = new SchoolDO({ name: 'school #2}', systems: [] });
		schoolRepo.findById.mockResolvedValue(schoolSaved);
		const schoolSavedId = schoolSaved.id as string;
		return {
			schoolSaved,
			schoolSavedId,
			schoolUnsaved,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('saveProvisioningSchoolOutputDto is called', () => {
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

		describe('when provisioningDto is given', () => {
			it('should call the createOrUpdateService', async () => {
				const ret = await schoolService.saveProvisioningSchoolOutputDto(provisioningDto);
				expect(ret).toBe(returnDO);
				expect(schoolServiceSpy).toHaveBeenCalled();
			});
		});
	});

	describe('createOrUpdate is called', () => {
		describe('when school is given', () => {
			it('should create new school', async () => {
				const { schoolUnsaved } = setup();

				await schoolService.createOrUpdateSchool(schoolUnsaved);

				expect(schoolRepo.save).toHaveBeenCalledWith(schoolUnsaved);
			});
		});

		describe('when update existing school', () => {
			it('should call the repo', async () => {
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
	});

	describe('hasFeature is called', () => {
		describe('when given schoolFeature exists on school', () => {
			it('should return true', async () => {
				const { schoolSavedId } = setup();

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

				expect(result).toBe(true);
			});
		});

		describe('when given schoolFeature does not exist on school', () => {
			it('should return false', async () => {
				const { schoolSaved, schoolSavedId } = setup();
				schoolSaved.features = [];
				schoolRepo.findById.mockResolvedValue(schoolSaved);

				const result = await schoolService.hasFeature(schoolSavedId, SchoolFeatures.VIDEOCONFERENCE);

				expect(result).toBe(false);
			});
		});
	});

	describe('getSchoolById is called', () => {
		describe('when id is given', () => {
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
	});

	describe('save is called', () => {
		describe('when school is given', () => {
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
	});

	describe('setMigration is called', () => {
		let testId: string;
		let testDO: SchoolDO;
		beforeAll(() => {
			testId = 'migration';
			testDO = new SchoolDO({
				id: testId,
				name: 'testDO',
				oauthMigrationPossible: true,
				oauthMigrationMandatory: true,
				officialSchoolNumber: '1337',
			});
			schoolRepo.findById.mockResolvedValue(testDO);
			schoolRepo.save.mockResolvedValue(testDO);
		});

		describe('when migrationflags and schoolId are given', () => {
			it('it should set the migrationflags', async () => {
				const resp: MigrationResponse = await schoolService.setMigration(testId, true, true);

				expect(resp.oauthMigrationPossible).toBeTruthy();
				expect(resp.oauthMigrationMandatory).toBeTruthy();
				expect(resp.enableMigrationStart).toBeTruthy();
				expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
				expect(schoolRepo.save).toHaveBeenCalledWith(testDO);
			});
		});
	});

	describe('getMigration is called', () => {
		let testId: string;
		let testDO: SchoolDO;
		beforeEach(() => {
			testId = 'migration';
			testDO = new SchoolDO({
				id: testId,
				name: 'testDO',
				oauthMigrationPossible: true,
				oauthMigrationMandatory: true,
				officialSchoolNumber: '1337',
			});
			schoolRepo.findById.mockResolvedValue(testDO);
		});

		describe('when migrationfalgs and officialSchoolNumber are set and schoolId is given', () => {
			it('it should get the migrationflags', async () => {
				const resp: MigrationResponse = await schoolService.getMigration(testId);

				expect(resp.oauthMigrationPossible).toBeTruthy();
				expect(resp.oauthMigrationMandatory).toBeTruthy();
				expect(resp.enableMigrationStart).toBeTruthy();
				expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
			});
		});

		describe('when migrationfalgs and officialSchoolNumber are not set and schoolId is given', () => {
			it('it should get the migrationflags when not set', async () => {
				testDO.oauthMigrationPossible = undefined;
				testDO.oauthMigrationMandatory = undefined;
				testDO.officialSchoolNumber = undefined;

				const resp: MigrationResponse = await schoolService.getMigration(testId);

				expect(resp.oauthMigrationPossible).toBeFalsy();
				expect(resp.oauthMigrationMandatory).toBeFalsy();
				expect(resp.enableMigrationStart).toBeFalsy();
				expect(schoolRepo.findById).toHaveBeenCalledWith(testId);
			});
		});
	});
});
