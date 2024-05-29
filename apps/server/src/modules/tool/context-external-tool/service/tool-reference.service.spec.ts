import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { externalToolFactory, toolConfigurationStatusFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ToolReference } from '../domain';
import { contextExternalToolFactory } from '../testing';
import { ContextExternalToolService } from './context-external-tool.service';
import { ToolConfigurationStatusService } from './tool-configuration-status.service';
import { ToolReferenceService } from './tool-reference.service';

describe('ToolReferenceService', () => {
	let module: TestingModule;
	let service: ToolReferenceService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolConfigurationStatusService: DeepMocked<ToolConfigurationStatusService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;

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
					provide: ToolConfigurationStatusService,
					useValue: createMock<ToolConfigurationStatusService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
			],
		}).compile();

		service = module.get(ToolReferenceService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolConfigurationStatusService = module.get(ToolConfigurationStatusService);
		externalToolLogoService = module.get(ExternalToolLogoService);
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
				const userId: string = new ObjectId().toHexString();
				const contextExternalToolId = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId(undefined, contextExternalToolId);
				const logoUrl = 'logoUrl';

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolConfigurationStatusService.determineToolConfigurationStatus.mockResolvedValue(
					toolConfigurationStatusFactory.build({
						isOutdatedOnScopeSchool: true,
						isOutdatedOnScopeContext: false,
					})
				);
				externalToolLogoService.buildLogoUrl.mockReturnValue(logoUrl);

				return {
					contextExternalToolId,
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					logoUrl,
					userId,
				};
			};

			it('should determine the tool status', async () => {
				const { contextExternalToolId, externalTool, schoolExternalTool, contextExternalTool, userId } = setup();

				await service.getToolReference(contextExternalToolId, userId);

				expect(toolConfigurationStatusService.determineToolConfigurationStatus).toHaveBeenCalledWith(
					externalTool,
					schoolExternalTool,
					contextExternalTool,
					userId
				);
			});

			it('should build the logo url', async () => {
				const { contextExternalToolId, externalTool, userId } = setup();

				await service.getToolReference(contextExternalToolId, userId);

				expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(externalTool);
			});

			it('should return the tool reference', async () => {
				const { contextExternalToolId, logoUrl, contextExternalTool, externalTool, userId } = setup();

				const result: ToolReference = await service.getToolReference(contextExternalToolId, userId);

				expect(result).toEqual<ToolReference>({
					logoUrl,
					displayName: contextExternalTool.displayName as string,
					openInNewTab: externalTool.openNewTab,
					status: toolConfigurationStatusFactory.build({
						isOutdatedOnScopeSchool: true,
						isOutdatedOnScopeContext: false,
					}),
					contextToolId: contextExternalToolId,
					description: externalTool.description,
				});
			});
		});
	});
});
