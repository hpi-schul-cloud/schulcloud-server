import { Test, TestingModule } from '@nestjs/testing';
import { SchoolService } from '@src/modules/school/service/school.service';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolFeatures } from '@shared/domain';

describe('SchoolUc', () => {
	let module: TestingModule;
	let schoolUc: SchoolUc;
	let schoolService: DeepMocked<SchoolService>;
	let schoolDto: SchoolDto;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();
		schoolService = module.get(SchoolService);
		schoolUc = module.get(SchoolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		schoolDto = new SchoolDto({ name: 'schule1234', externalId: 'externeSchule1234', systemIds: [] });

		schoolService.createOrUpdateSchool.mockImplementation((): Promise<SchoolDto> => {
			return Promise.resolve(schoolDto);
		});
	});

	describe('createOrUpdate', () => {
		it('should call schoolService', async () => {
			await schoolUc.createOrUpdate(schoolDto);

			expect(schoolService.createOrUpdateSchool).toHaveBeenCalledWith(
				expect.objectContaining({ name: schoolDto.name })
			);
		});
	});

	describe('saveProvisioningSchoolOutputDto', () => {
		afterEach(() => {
			schoolUc = module.get(SchoolUc);
		});

		it('should call save', async () => {
			const dto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
				name: schoolDto.name,
				externalId: schoolDto.externalId as string,
				systemIds: [],
			});
			schoolUc.createOrUpdate = jest.fn();

			await schoolUc.saveProvisioningSchoolOutputDto(dto);

			expect(schoolUc.createOrUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: schoolDto.name }));
		});
	});

	describe('hasFeature', () => {
		it('should call hasFeature', async () => {
			await schoolUc.hasFeature('schoolId', SchoolFeatures.VIDEOCONFERENCE);

			expect(schoolService.hasFeature).toHaveBeenCalledWith('schoolId', SchoolFeatures.VIDEOCONFERENCE);
		});
	});
});
