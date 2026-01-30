import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceLicenseType, MediaSourceService } from '@modules/media-source';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { SchoolService } from '@modules/school';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common/error';
import { ToolContextType } from '../../common/enum';
import { CommonToolDeleteService, CommonToolValidationService } from '../../common/service';
import { ExternalToolService } from '../../external-tool';
import { type ExternalTool } from '../../external-tool/domain';
import { ExternalToolMediumStatus } from '../../external-tool/enum';
import { externalToolFactory } from '../../external-tool/testing';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { SchoolExternalTool, SchoolExternalToolConfigurationStatus, SchoolExternalToolMedium } from '../domain';
import { SchoolExternalToolRepo } from '../repo';
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
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let config: ToolConfig;

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
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: TOOL_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(SchoolExternalToolService);
		schoolExternalToolRepo = module.get(SchoolExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		commonToolValidationService = module.get(CommonToolValidationService);
		commonToolDeleteService = module.get(CommonToolDeleteService);
		mediaSourceService = module.get(MediaSourceService);
		config = module.get(TOOL_CONFIG_TOKEN);
	});

	describe('findById', () => {
		describe('when schoolExternalToolId is given', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					medium: undefined,
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});

				schoolExternalToolRepo.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				config.featureSchulconnexMediaLicenseEnabled = true;

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

		describe('when the tool has a medium with user licenses', () => {
			const setup = () => {
				const mediumStatus = ExternalToolMediumStatus.ACTIVE;
				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';
				const mediaSourceName = 'mediaSourceName';
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({
						status: mediumStatus,
						mediumId,
						mediaSourceId,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});
				const mediaSource = mediaSourceFactory.build({ name: mediaSourceName, sourceId: mediaSourceId });

				schoolExternalToolRepo.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				config.featureSchulconnexMediaLicenseEnabled = true;
				mediaSourceService.findBySourceId.mockResolvedValueOnce(mediaSource);

				return {
					schoolExternalTool,
					externalTool,
					mediaSource,
					mediumId,
					mediaSourceId,
					mediaSourceName,
					mediumStatus,
				};
			};

			it('should return the schoolExternalTool with medium data', async () => {
				const { schoolExternalTool, externalTool, mediumId, mediaSourceId, mediaSourceName, mediumStatus } = setup();

				const result = await service.findById(schoolExternalTool.id);

				expect(result).toEqual(
					new SchoolExternalTool({
						...schoolExternalTool.getProps(),
						name: externalTool.name,
						medium: new SchoolExternalToolMedium({
							status: mediumStatus,
							mediumId,
							mediaSourceId,
							mediaSourceName,
							mediaSourceLicenseType: MediaSourceLicenseType.USER_LICENSE,
						}),
						status: new SchoolExternalToolConfigurationStatus({
							isGloballyDeactivated: externalTool.isDeactivated,
							isOutdatedOnScopeSchool: true,
						}),
					})
				);
			});
		});

		describe('when the tool has a medium with school licenses', () => {
			const setup = () => {
				const mediumStatus = ExternalToolMediumStatus.ACTIVE;

				const mediumId = 'mediumId';
				const mediaSourceId = 'mediaSourceId';
				const mediaSourceName = 'mediaSourceName';
				const externalTool: ExternalTool = externalToolFactory
					.withMedium({
						status: mediumStatus,
						mediumId,
						mediaSourceId,
					})
					.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					name: undefined,
					status: undefined,
				});
				const mediaSource = mediaSourceFactory.withVidis().build({ name: mediaSourceName, sourceId: mediaSourceId });

				schoolExternalToolRepo.findById.mockResolvedValue(schoolExternalTool);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([new ValidationError('')]);
				config.featureSchulconnexMediaLicenseEnabled = true;
				mediaSourceService.findBySourceId.mockResolvedValueOnce(mediaSource);

				return {
					schoolExternalTool,
					externalTool,
					mediaSource,
					mediumId,
					mediaSourceId,
					mediaSourceName,
					mediumStatus,
				};
			};

			it('should return the schoolExternalTool with medium data', async () => {
				const { schoolExternalTool, externalTool, mediumId, mediaSourceId, mediaSourceName, mediumStatus } = setup();

				const result = await service.findById(schoolExternalTool.id);

				expect(result).toEqual(
					new SchoolExternalTool({
						...schoolExternalTool.getProps(),
						name: externalTool.name,
						medium: new SchoolExternalToolMedium({
							status: mediumStatus,
							mediumId,
							mediaSourceId,
							mediaSourceName,
							mediaSourceLicenseType: MediaSourceLicenseType.SCHOOL_LICENSE,
						}),
						status: new SchoolExternalToolConfigurationStatus({
							isGloballyDeactivated: externalTool.isDeactivated,
							isOutdatedOnScopeSchool: true,
						}),
					})
				);
			});
		});
	});

	describe('findSchoolExternalTools', () => {
		describe('when called with query', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.COURSE],
				});
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
				config.featureSchulconnexMediaLicenseEnabled = false;

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
						restrictToContexts: externalTool.restrictToContexts,
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
				config.featureSchulconnexMediaLicenseEnabled = false;

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
