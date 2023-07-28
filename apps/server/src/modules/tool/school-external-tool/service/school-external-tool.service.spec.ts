import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolExternalToolRepo } from '@shared/repo';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from './school-external-tool.service';
import { ExternalToolDO } from '../../external-tool/domain';
import { SchoolExternalToolDO } from '../domain';
import { ToolConfigurationStatus } from '../../common/enum';

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
		const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
		const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId();

		schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);

		return {
			schoolExternalTool,
			schoolExternalToolId: schoolExternalTool.id as string,
			externalToolDO,
		};
	};

	describe('findSchoolExternalTools is called', () => {
		describe('when called with query', () => {
			it('should call repo with query', async () => {
				const { schoolExternalTool } = setup();

				await service.findSchoolExternalTools(schoolExternalTool);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith({ schoolId: schoolExternalTool.schoolId });
			});

			it('should return schoolExternalToolDO array', async () => {
				const { schoolExternalTool } = setup();
				schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool, schoolExternalTool]);

				const result: SchoolExternalToolDO[] = await service.findSchoolExternalTools(schoolExternalTool);

				expect(Array.isArray(result)).toBe(true);
			});
		});
	});

	describe('enrichDataFromExternalTool is called', () => {
		it('should call the externalToolService', async () => {
			const { schoolExternalTool } = setup();
			schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);

			await service.findSchoolExternalTools(schoolExternalTool);

			expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(schoolExternalTool.toolId);
		});

		describe('when determine status', () => {
			describe('when external tool version is greater', () => {
				it('should return status outdated', async () => {
					const { schoolExternalTool, externalToolDO } = setup();
					externalToolDO.version = 1337;
					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

					const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(
						schoolExternalTool
					);

					expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.OUTDATED);
				});
			});

			describe('when external tool version is lower', () => {
				it('should return status latest', async () => {
					const { schoolExternalTool, externalToolDO } = setup();
					schoolExternalTool.toolVersion = 1;
					externalToolDO.version = 0;
					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

					const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(
						schoolExternalTool
					);

					expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.LATEST);
				});
			});

			describe('when external tool version is equal', () => {
				it('should return status latest', async () => {
					const { schoolExternalTool, externalToolDO } = setup();
					schoolExternalTool.toolVersion = 1;
					externalToolDO.version = 1;
					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findExternalToolById.mockResolvedValue(externalToolDO);

					const schoolExternalToolDOs: SchoolExternalToolDO[] = await service.findSchoolExternalTools(
						schoolExternalTool
					);

					expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.LATEST);
				});
			});
		});
	});

	describe('deleteSchoolExternalToolById is called', () => {
		describe('when schoolExternalToolId is given', () => {
			it('should call the schoolExternalToolRepo', async () => {
				const { schoolExternalToolId } = setup();

				await service.deleteSchoolExternalToolById(schoolExternalToolId);

				expect(schoolExternalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('getSchoolExternalToolById is called', () => {
		describe('when schoolExternalToolId is given', () => {
			it('should call schoolExternalToolRepo.findById', async () => {
				const { schoolExternalToolId } = setup();

				await service.getSchoolExternalToolById(schoolExternalToolId);

				expect(schoolExternalToolRepo.findById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('saveSchoolExternalTool is called', () => {
		describe('when schoolExternalTool is given', () => {
			it('should call schoolExternalToolRepo.save', async () => {
				const { schoolExternalTool } = setup();

				await service.saveSchoolExternalTool(schoolExternalTool);

				expect(schoolExternalToolRepo.save).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should enrich data from externalTool', async () => {
				const { schoolExternalTool } = setup();

				await service.saveSchoolExternalTool(schoolExternalTool);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});
		});
	});
});
