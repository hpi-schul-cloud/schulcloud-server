import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import {
	externalToolFactory,
	schoolExternalToolFactory,
	schoolToolConfigurationStatusFactory,
} from '@shared/testing/factory';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { SchoolExternalToolConfigurationStatus } from '../controller/domain/school-external-tool-configuration-status';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
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
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const schoolExternalToolQuery: SchoolExternalToolQuery = {
					schoolId: schoolExternalTool.schoolId,
					toolId: schoolExternalTool.toolId,
					isDeactivated: !!schoolExternalTool.status?.isDeactivated,
				};

				schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
				toolFearures.toolStatusWithoutVersions = false;

				return {
					schoolExternalTool,
					schoolExternalToolId: schoolExternalTool.id as string,
					schoolExternalToolQuery,
				};
			};

			it('should call repo with query', async () => {
				const { schoolExternalTool, schoolExternalToolQuery } = setup();

				await service.findSchoolExternalTools(schoolExternalToolQuery);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith<[Required<SchoolExternalToolQuery>]>({
					schoolId: schoolExternalTool.schoolId,
					toolId: schoolExternalTool.toolId,
					isDeactivated: !!schoolExternalTool.status?.isDeactivated,
				});
			});

			it('should return schoolExternalTool array', async () => {
				const { schoolExternalToolQuery } = setup();

				const result: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalToolQuery);

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

						expect(schoolExternalToolDOs[0].status).toEqual<SchoolExternalToolConfigurationStatus>(
							schoolToolConfigurationStatusFactory.build({
								isOutdatedOnScopeSchool: true,
							})
						);
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

						expect(schoolExternalToolDOs[0].status).toEqual(
							schoolToolConfigurationStatusFactory.build({
								isOutdatedOnScopeSchool: false,
							})
						);
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

						expect(schoolExternalToolDOs[0].status).toEqual(
							schoolToolConfigurationStatusFactory.build({
								isOutdatedOnScopeSchool: false,
							})
						);
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
					expect(schoolExternalToolDOs[0].status).toEqual(
						schoolToolConfigurationStatusFactory.build({
							isOutdatedOnScopeSchool: false,
						})
					);
				});

				it('should return non deactivated tool status', async () => {
					const { schoolExternalTool } = setup();

					const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

					expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
					expect(schoolExternalToolDOs[0].status).toEqual(
						schoolToolConfigurationStatusFactory.build({
							isDeactivated: false,
						})
					);
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
					expect(schoolExternalToolDOs[0].status).toEqual(
						schoolToolConfigurationStatusFactory.build({
							isOutdatedOnScopeSchool: true,
						})
					);
				});
			});

			describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and schoolExternalTool is deactivated', () => {
				const setup = () => {
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
						status: schoolToolConfigurationStatusFactory.build({ isDeactivated: true }),
					});
					const externalTool: ExternalTool = externalToolFactory.buildWithId();

					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findById.mockResolvedValue(externalTool);
					schoolExternalToolValidationService.validate.mockRejectedValue(Promise.resolve());
					toolFearures.toolStatusWithoutVersions = true;

					return {
						schoolExternalTool,
					};
				};

				it('should return deactivated tool status true', async () => {
					const { schoolExternalTool } = setup();

					const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

					expect(schoolExternalToolDOs[0].status).toEqual(
						schoolToolConfigurationStatusFactory.build({
							isDeactivated: true,
							isOutdatedOnScopeSchool: true,
						})
					);
				});
			});

			describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true and externalTool is deactivated', () => {
				const setup = () => {
					const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
					const externalTool: ExternalTool = externalToolFactory.buildWithId({ isDeactivated: true });

					schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
					externalToolService.findById.mockResolvedValue(externalTool);
					schoolExternalToolValidationService.validate.mockRejectedValue(Promise.resolve());
					toolFearures.toolStatusWithoutVersions = true;

					return {
						schoolExternalTool,
					};
				};

				it('should return deactivated tool status true', async () => {
					const { schoolExternalTool } = setup();

					const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalTool);

					expect(schoolExternalToolDOs[0].status).toEqual(
						schoolToolConfigurationStatusFactory.build({
							isDeactivated: true,
							isOutdatedOnScopeSchool: true,
						})
					);
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
