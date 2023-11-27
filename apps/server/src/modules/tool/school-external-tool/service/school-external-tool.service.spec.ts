import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { externalToolFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { ToolConfigurationStatus } from '../../common/enum';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';
import { SchoolExternalToolService } from './school-external-tool.service';

describe('SchoolExternalToolService', () => {
	let module: TestingModule;
	let service: SchoolExternalToolService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;
	let toolFearures: DeepMocked<IToolFeatures>;

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
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						toolStatusWithoutVersions: false,
					},
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
		toolFearures = module.get(ToolFeatures);
	});

	// TODO N21-1337 refactor setup into the describe blocks
	const legacySetup = () => {
		const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
		const externalTool: ExternalTool = externalToolFactory.buildWithId();

		schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
		toolFearures.toolStatusWithoutVersions = false;

		return {
			schoolExternalTool,
			schoolExternalToolId: schoolExternalTool.id as string,
			externalTool,
		};
	};

	describe('findSchoolExternalTools', () => {
		describe('when called with query', () => {
			it('should call repo with query', async () => {
				const { schoolExternalTool } = legacySetup();

				await service.findSchoolExternalTools(schoolExternalTool);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith({ schoolId: schoolExternalTool.schoolId });
			});

			it('should return schoolExternalTool array', async () => {
				const { schoolExternalTool } = legacySetup();
				schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool, schoolExternalTool]);

				const result: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

				expect(Array.isArray(result)).toBe(true);
			});
		});
	});

	describe('enrichDataFromExternalTool', () => {
		it('should call the externalToolService', async () => {
			const { schoolExternalTool } = legacySetup();
			schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);

			await service.findSchoolExternalTools(schoolExternalTool);

			expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
		});

		describe('when determine status', () => {
			describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is false', () => {
				describe('when external tool version is greater', () => {
					it('should return status outdated', async () => {
						const { schoolExternalTool, externalTool } = legacySetup();
						externalTool.version = 1337;
						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
							schoolExternalTool
						);

						expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.OUTDATED);
					});
				});

				describe('when external tool version is lower', () => {
					it('should return status latest', async () => {
						const { schoolExternalTool, externalTool } = legacySetup();
						schoolExternalTool.toolVersion = 1;
						externalTool.version = 0;
						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
							schoolExternalTool
						);

						expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.LATEST);
					});
				});

				describe('when external tool version is equal', () => {
					it('should return status latest', async () => {
						const { schoolExternalTool, externalTool } = legacySetup();
						schoolExternalTool.toolVersion = 1;
						externalTool.version = 1;
						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
							schoolExternalTool
						);

						expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.LATEST);
					});
				});
			});

			describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation goes through', () => {
				const setup = () => {
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const externalTool: ExternalTool = externalToolFactory.buildWithId();

					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findById.mockResolvedValue(externalTool);
					schoolExternalToolValidationService.validate.mockResolvedValue();
					toolFearures.toolStatusWithoutVersions = true;

					return {
						schoolExternalTool,
					};
				};

				it('should return latest tool status', async () => {
					const { schoolExternalTool } = setup();

					const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

					expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
					expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.LATEST);
				});
			});

			describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and validation throws error', () => {
				const setup = () => {
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const externalTool: ExternalTool = externalToolFactory.buildWithId();

					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findById.mockResolvedValue(externalTool);
					schoolExternalToolValidationService.validate.mockRejectedValue(ApiValidationError);
					toolFearures.toolStatusWithoutVersions = true;

					return {
						schoolExternalTool,
					};
				};

				it('should return outdated tool status', async () => {
					const { schoolExternalTool } = setup();

					const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

					expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
					expect(schoolExternalToolDOs[0].status).toEqual(ToolConfigurationStatus.OUTDATED);
				});
			});
		});
	});

	describe('deleteSchoolExternalToolById', () => {
		describe('when schoolExternalToolId is given', () => {
			it('should call the schoolExternalToolRepo', async () => {
				const { schoolExternalToolId } = legacySetup();

				await service.deleteSchoolExternalToolById(schoolExternalToolId);

				expect(schoolExternalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('findById', () => {
		describe('when schoolExternalToolId is given', () => {
			it('should call schoolExternalToolRepo.findById', async () => {
				const { schoolExternalToolId } = legacySetup();

				await service.findById(schoolExternalToolId);

				expect(schoolExternalToolRepo.findById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('saveSchoolExternalTool', () => {
		describe('when schoolExternalTool is given', () => {
			it('should call schoolExternalToolRepo.save', async () => {
				const { schoolExternalTool } = legacySetup();

				await service.saveSchoolExternalTool(schoolExternalTool);

				expect(schoolExternalToolRepo.save).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should enrich data from externalTool', async () => {
				const { schoolExternalTool } = legacySetup();

				await service.saveSchoolExternalTool(schoolExternalTool);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});
		});
	});
});
