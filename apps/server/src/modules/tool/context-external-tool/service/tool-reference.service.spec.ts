import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ApiValidationError } from '@shared/common';
import { ToolConfigurationStatus } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { ToolReference } from '../domain';
import { ContextExternalToolService } from './context-external-tool.service';
import { ToolReferenceService } from './tool-reference.service';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';
import objectContaining = jasmine.objectContaining;

describe('ToolReferenceService', () => {
	let module: TestingModule;
	let service: ToolReferenceService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let commonToolService: DeepMocked<CommonToolService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolReferenceService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
			],
		}).compile();

		service = module.get(ToolReferenceService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		commonToolService = module.get(CommonToolService);
		externalToolLogoService = module.get(ExternalToolLogoService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getToolReference', () => {
		describe('when a context external tool id is provided', () => {
			const setup = () => {
				const contextExternalToolId = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId(undefined, contextExternalToolId);
				const logoUrl = 'logoUrl';

				contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolService.determineToolConfigurationStatus.mockReturnValue(ToolConfigurationStatus.OUTDATED);
				externalToolLogoService.buildLogoUrl.mockReturnValue(logoUrl);

				Configuration.set('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED', false);

				return {
					contextExternalToolId,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					logoUrl,
				};
			};

			it('should determine the tool status', async () => {
				const { contextExternalToolId, externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.getToolReference(contextExternalToolId);

				expect(commonToolService.determineToolConfigurationStatus).toHaveBeenCalledWith(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);
			});

			it('should build the logo url', async () => {
				const { contextExternalToolId, externalTool } = setup();

				await service.getToolReference(contextExternalToolId);

				expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(
					'/v3/tools/external-tools/{id}/logo',
					externalTool
				);
			});

			it('should return the tool reference', async () => {
				const { contextExternalToolId, logoUrl, contextExternalTool, externalTool } = setup();

				const result: ToolReference = await service.getToolReference(contextExternalToolId);

				expect(result).toEqual<ToolReference>({
					logoUrl,
					displayName: contextExternalTool.displayName as string,
					openInNewTab: externalTool.openNewTab,
					status: ToolConfigurationStatus.OUTDATED,
					contextToolId: contextExternalToolId,
				});
			});
		});

		describe('when FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED is true', () => {
			const setup = () => {
				const contextExternalToolId = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string)
					.buildWithId(undefined, contextExternalToolId);
				const logoUrl = 'logoUrl';

				contextExternalToolService.findById.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.OUTDATED);
				externalToolLogoService.buildLogoUrl.mockReturnValue(logoUrl);

				schoolExternalToolValidationService.validate.mockRejectedValueOnce(ApiValidationError);
				Configuration.set('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED', true);

				return {
					contextExternalToolId,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should determine the tool status through validation', async () => {
				const { contextExternalToolId, schoolExternalTool, contextExternalTool } = setup();

				await service.getToolReference(contextExternalToolId);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(schoolExternalTool);
				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should get the outdated status', async () => {
				const { contextExternalToolId } = setup();

				const toolReference: ToolReference = await service.getToolReference(contextExternalToolId);

				expect(toolReference).toEqual(expect.objectContaining({ status: ToolConfigurationStatus.OUTDATED }));
			});
		});
	});
});
