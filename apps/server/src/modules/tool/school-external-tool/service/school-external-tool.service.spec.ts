import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { ExternalToolService } from '../../external-tool';
import { ExternalTool } from '../../external-tool/domain';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalTool } from '../domain';
import { schoolExternalToolConfigurationStatusFactory, schoolExternalToolFactory } from '../testing';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolValidationService } from './school-external-tool-validation.service';
import { SchoolExternalToolService } from './school-external-tool.service';

describe(SchoolExternalToolService.name, () => {
	let module: TestingModule;
	let service: SchoolExternalToolService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;

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
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
	});

	describe('findSchoolExternalTools', () => {
		describe('when called with query', () => {
			describe('findSchoolExternalTools', () => {
				describe('when called with query', () => {
					const setup = () => {
						const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
						const schoolExternalToolQuery: SchoolExternalToolQuery = {
							schoolId: schoolExternalTool.schoolId,
							toolId: schoolExternalTool.toolId,
							isDeactivated: !!schoolExternalTool.status?.isDeactivated,
						};

						schoolExternalToolRepo.find.mockResolvedValueOnce([schoolExternalTool]);

						return {
							schoolExternalTool,
							schoolExternalToolId: schoolExternalTool.id,
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
				describe('when schoolExternalTool is given', () => {
					const setup = () => {
						const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
						const externalTool: ExternalTool = externalToolFactory.buildWithId();

						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							schoolExternalTool,
						};
					};

					it('should call the externalToolService', async () => {
						const { schoolExternalTool } = setup();

						await service.findSchoolExternalTools(schoolExternalTool);

						expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
					});
				});

				describe('when determine status', () => {
					describe('when validation goes through', () => {
						const setup = () => {
							const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
							const externalTool: ExternalTool = externalToolFactory.buildWithId();

							schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
							externalToolService.findById.mockResolvedValue(externalTool);
							schoolExternalToolValidationService.validate.mockResolvedValue();

							return {
								schoolExternalTool,
							};
						};

						it('should return latest tool status', async () => {
							const { schoolExternalTool } = setup();

							const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
								schoolExternalTool
							);

							expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
							expect(schoolExternalToolDOs[0].status).toEqual(
								schoolExternalToolConfigurationStatusFactory.build({
									isOutdatedOnScopeSchool: false,
								})
							);
						});

						it('should return non deactivated tool status', async () => {
							const { schoolExternalTool } = setup();

							const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
								schoolExternalTool
							);

							expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
							expect(schoolExternalToolDOs[0].status).toEqual(
								schoolExternalToolConfigurationStatusFactory.build({
									isDeactivated: false,
								})
							);
						});
					});

					describe('when validation throws error', () => {
						const setup = () => {
							const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
							const externalTool: ExternalTool = externalToolFactory.buildWithId();

							schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
							externalToolService.findById.mockResolvedValue(externalTool);
							schoolExternalToolValidationService.validate.mockRejectedValue(ApiValidationError);

							return {
								schoolExternalTool,
							};
						};

						it('should return outdated tool status', async () => {
							const { schoolExternalTool } = setup();

							const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
								schoolExternalTool
							);

							expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
							expect(schoolExternalToolDOs[0].status).toEqual(
								schoolExternalToolConfigurationStatusFactory.build({
									isOutdatedOnScopeSchool: true,
								})
							);
						});
					});

					describe('when schoolExternalTool is deactivated', () => {
						const setup = () => {
							const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
								status: schoolExternalToolConfigurationStatusFactory.build({ isDeactivated: true }),
							});
							const externalTool: ExternalTool = externalToolFactory.buildWithId();

							schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
							externalToolService.findById.mockResolvedValue(externalTool);
							schoolExternalToolValidationService.validate.mockRejectedValue(Promise.resolve());

							return {
								schoolExternalTool,
							};
						};

						it('should return deactivated tool status true', async () => {
							const { schoolExternalTool } = setup();

							const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
								schoolExternalTool
							);

							expect(schoolExternalToolDOs[0].status).toEqual(
								schoolExternalToolConfigurationStatusFactory.build({
									isDeactivated: true,
									isOutdatedOnScopeSchool: true,
								})
							);
						});
					});

					describe('when externalTool is deactivated', () => {
						const setup = () => {
							const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
							const externalTool: ExternalTool = externalToolFactory.buildWithId({ isDeactivated: true });

							schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
							externalToolService.findById.mockResolvedValue(externalTool);
							schoolExternalToolValidationService.validate.mockRejectedValue(Promise.resolve());

							return {
								schoolExternalTool,
							};
						};

						it('should return deactivated tool status true', async () => {
							const { schoolExternalTool } = setup();

							const schoolExternalToolDOs: SchoolExternalTool[] = await service.findSchoolExternalTools(
								schoolExternalTool
							);

							expect(schoolExternalToolDOs[0].status).toEqual(
								schoolExternalToolConfigurationStatusFactory.build({
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
					const setup = () => {
						const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
						const externalTool: ExternalTool = externalToolFactory.buildWithId();

						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							schoolExternalToolId: schoolExternalTool.id,
						};
					};

					it('should call the schoolExternalToolRepo', () => {
						const { schoolExternalToolId } = setup();

						service.deleteSchoolExternalToolById(schoolExternalToolId);

						expect(schoolExternalToolRepo.deleteById).toHaveBeenCalledWith(schoolExternalToolId);
					});
				});
			});

			describe('findById', () => {
				describe('when schoolExternalToolId is given', () => {
					const setup = () => {
						const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
						const externalTool: ExternalTool = externalToolFactory.buildWithId();

						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							schoolExternalToolId: schoolExternalTool.id,
						};
					};

					it('should call schoolExternalToolRepo.findById', async () => {
						const { schoolExternalToolId } = setup();

						await service.findById(schoolExternalToolId);

						expect(schoolExternalToolRepo.findById).toHaveBeenCalledWith(schoolExternalToolId);
					});
				});
			});

			describe('saveSchoolExternalTool', () => {
				describe('when schoolExternalTool is given', () => {
					const setup = () => {
						const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
						const externalTool: ExternalTool = externalToolFactory.buildWithId();

						schoolExternalToolRepo.find.mockResolvedValue([schoolExternalTool]);
						externalToolService.findById.mockResolvedValue(externalTool);

						return {
							schoolExternalTool,
						};
					};

					it('should call schoolExternalToolRepo.save', async () => {
						const { schoolExternalTool } = setup();

						await service.saveSchoolExternalTool(schoolExternalTool);

						expect(schoolExternalToolRepo.save).toHaveBeenCalledWith(schoolExternalTool);
					});

					it('should enrich data from externalTool', async () => {
						const { schoolExternalTool } = setup();

						await service.saveSchoolExternalTool(schoolExternalTool);

						expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
					});
				});
			});
		});
	});
});
