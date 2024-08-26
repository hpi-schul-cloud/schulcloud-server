import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { SchoolExternalToolRepo } from '@shared/repo';
import { CommonToolDeleteService, CommonToolValidationService } from '../../common/service';
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
	let commonToolDeleteService: DeepMocked<CommonToolDeleteService>;

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
				{
					provide: CommonToolDeleteService,
					useValue: createMock<CommonToolDeleteService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
		commonToolDeleteService = module.get(CommonToolDeleteService);
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

	describe('deleteSchoolExternalTool', () => {
		describe('when schoolExternalTool is given', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();

				return {
					schoolExternalTool,
				};
			};

			it('should call the schoolExternalToolRepo', async () => {
				const { schoolExternalTool } = setup();

				await service.deleteSchoolExternalTool(schoolExternalTool);

				expect(commonToolDeleteService.deleteSchoolExternalTool).toHaveBeenCalledWith(schoolExternalTool);
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
