import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
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

	describe('findSchoolExternalTools is called', () => {
		describe('when called with query', () => {
			it('should call repo with query', async () => {
				const tool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();

				await service.findSchoolExternalTools(tool);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith(tool);
			});

			it('should return schoolExternalToolDO array', async () => {
				const tool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
				schoolExternalToolRepo.find.mockResolvedValue([tool, tool]);

				const result: SchoolExternalToolDO[] = await service.findSchoolExternalTools(tool);

				expect(result).toEqual([tool, tool]);
			});
		});
	});
});
