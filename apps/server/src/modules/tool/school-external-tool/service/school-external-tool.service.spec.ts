import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool';
import { type ExternalTool } from '../../external-tool/domain';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalTool, SchoolExternalToolConfigurationStatus } from '../domain';
import { schoolExternalToolFactory } from '../testing';
import { SchoolExternalToolQuery } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolService } from './school-external-tool.service';

describe(SchoolExternalToolService.name, () => {
	let module: TestingModule;
	let service: SchoolExternalToolService;

	let schoolExternalToolRepo: DeepMocked<SchoolExternalToolRepo>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;

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
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
	});

	describe('findSchoolExternalTools', () => {
		describe('when called with query', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});

				const schoolExternalToolQuery: SchoolExternalToolQuery = {
					schoolId: schoolExternalTool.schoolId,
					toolId: schoolExternalTool.toolId,
					isDeactivated: schoolExternalTool.isDeactivated,
				};

				schoolExternalToolRepo.find.mockResolvedValueOnce([schoolExternalTool]);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					externalTool,
					schoolExternalTool,
					schoolExternalToolQuery,
				};
			};

			it('should call repo with query', async () => {
				const { schoolExternalTool, schoolExternalToolQuery } = setup();

				await service.findSchoolExternalTools(schoolExternalToolQuery);

				expect(schoolExternalToolRepo.find).toHaveBeenCalledWith<[Required<SchoolExternalToolQuery>]>({
					schoolId: schoolExternalTool.schoolId,
					toolId: schoolExternalTool.toolId,
					isDeactivated: schoolExternalTool.isDeactivated,
				});
			});

			it('should return schoolExternalTool array with enriched data', async () => {
				const { schoolExternalToolQuery, schoolExternalTool, externalTool } = setup();

				const result: SchoolExternalTool[] = await service.findSchoolExternalTools(schoolExternalToolQuery);

				expect(result).toEqual([
					new SchoolExternalTool({
						...schoolExternalTool.getProps(),
						name: externalTool.name,
						status: new SchoolExternalToolConfigurationStatus({
							isGloballyDeactivated: externalTool.isDeactivated,
							isOutdatedOnScopeSchool: true,
						}),
					}),
				]);
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
				const externalTool: ExternalTool = externalToolFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});

				schoolExternalToolRepo.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					schoolExternalTool,
					externalTool,
				};
			};

			it('should call schoolExternalToolRepo.findById', async () => {
				const { schoolExternalTool } = setup();

				await service.findById(schoolExternalTool.id);

				expect(schoolExternalToolRepo.findById).toHaveBeenCalledWith(schoolExternalTool.id);
			});

			it('should return the schoolExternalTool with enriched data', async () => {
				const { schoolExternalTool, externalTool } = setup();

				const result = await service.findById(schoolExternalTool.id);

				expect(result).toEqual(
					new SchoolExternalTool({
						...schoolExternalTool.getProps(),
						name: externalTool.name,
						status: new SchoolExternalToolConfigurationStatus({
							isGloballyDeactivated: externalTool.isDeactivated,
							isOutdatedOnScopeSchool: true,
						}),
					})
				);
			});
		});
	});

	describe('saveSchoolExternalTool', () => {
		describe('when schoolExternalTool is given', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});

				schoolExternalToolRepo.save.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);

				return {
					schoolExternalTool,
					externalTool,
				};
			};

			it('should call schoolExternalToolRepo.save', async () => {
				const { schoolExternalTool } = setup();

				await service.saveSchoolExternalTool(schoolExternalTool);

				expect(schoolExternalToolRepo.save).toHaveBeenCalledWith(schoolExternalTool);
			});

			it('should return the schoolExternalTool with enriched data', async () => {
				const { schoolExternalTool, externalTool } = setup();

				const result = await service.saveSchoolExternalTool(schoolExternalTool);

				expect(result).toEqual(
					new SchoolExternalTool({
						...schoolExternalTool.getProps(),
						name: externalTool.name,
						status: new SchoolExternalToolConfigurationStatus({
							isGloballyDeactivated: externalTool.isDeactivated,
							isOutdatedOnScopeSchool: true,
						}),
					})
				);
			});
		});
	});
});
