import { Test, TestingModule } from '@nestjs/testing';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolService } from './school-external-tool.service';

describe('SchoolExternalToolService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolService,
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findSchoolExternalToolsBySchoolId', () => {
		describe('when searching for school external tools by school id', () => {
			it('should find school external tools with a given school id', async () => {
				const schoolExternalToolDOs: SchoolExternalToolDO[] = schoolExternalToolDOFactory.buildListWithId(2);
				schoolExternalToolRepo.findBySchoolId.mockResolvedValue(schoolExternalToolDOs);

				const result: SchoolExternalToolDO[] = await service.findSchoolExternalToolsBySchoolId('schoolId');

				expect(result).toEqual(schoolExternalToolDOs);
			});
		});
	});
});
