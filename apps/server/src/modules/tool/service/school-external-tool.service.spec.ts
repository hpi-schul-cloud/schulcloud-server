import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolExternalToolStatus } from '@shared/domain/domainobject/external-tool/school-external-tool-status';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { ExternalToolService } from './external-tool.service';
import { SchoolExternalToolService } from './school-external-tool.service';

describe('SchoolExternalToolService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let externalToolService: DeepMocked<ExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolService,
				{
					provide: SchoolExternalToolRepo,
					useValue: createMock<SchoolExternalToolRepo>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
	});

	const setup = () => {
		const tool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
		const externalTool: ExternalToolDO = externalToolDOFactory.build();
		return {
			tool,
			externalTool,
		};
	};

	describe('findSchoolExternalTools is called', () => {
		describe('when called with query', () => {
			it('should call repo with query', async () => {
				const { tool } = setup();

				await service.findSchoolExternalTools(tool);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith({ schoolId: tool.schoolId });
			});

			it('should return schoolExternalToolDO array', async () => {
				const { tool } = setup();
				schoolExternalToolRepo.find.mockResolvedValue([tool, tool]);

				const result: SchoolExternalToolDO[] = await service.findSchoolExternalTools(tool);

				expect(Array.isArray(result)).toBe(true);
			});
		});

		describe('enrich data from externalTool', () => {
			it('should call the externalToolService', async () => {
				const { tool } = setup();
				schoolExternalToolRepo.find.mockResolvedValue([tool]);

				await service.findSchoolExternalTools(tool);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(tool.toolId);
			});

			describe('when determine status', () => {
				describe('when external tool version is greater', () => {
					it('should return status outdated', async () => {
						const { tool, externalTool } = setup();
						externalTool.version = 1337;
						schoolExternalToolRepo.find.mockResolvedValue([tool]);
						externalToolService.findExternalToolById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(tool);

						expect(schoolExternalToolDOs[0].status).toEqual(SchoolExternalToolStatus.OUTDATED);
					});
				});

				describe('when external tool version is lower', () => {
					it('should return status latest', async () => {
						const { tool, externalTool } = setup();
						tool.toolVersion = 1;
						externalTool.version = 0;
						schoolExternalToolRepo.find.mockResolvedValue([tool]);
						externalToolService.findExternalToolById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(tool);

						expect(schoolExternalToolDOs[0].status).toEqual(SchoolExternalToolStatus.LATEST);
					});
				});

				describe('when external tool version is equal', () => {
					it('should return status latest', async () => {
						const { tool, externalTool } = setup();
						tool.toolVersion = 1;
						externalTool.version = 1;
						schoolExternalToolRepo.find.mockResolvedValue([tool]);
						externalToolService.findExternalToolById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(tool);

						expect(schoolExternalToolDOs[0].status).toEqual(SchoolExternalToolStatus.LATEST);
					});
				});
			});
		});
	});
});
