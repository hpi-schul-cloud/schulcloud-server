import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {
	contextExternalToolFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	toolConfigurationStatusFactory,
} from '@shared/testing';
import { ExternalToolLogoService, ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalToolWithId } from '../../school-external-tool/domain';
import { ToolReference } from '../domain';
import { ContextExternalToolService } from './context-external-tool.service';
import { ToolReferenceService } from './tool-reference.service';
import { ToolConfigurationStatusService } from './tool-configuration-status.service';

describe('ToolReferenceService', () => {
	let module: TestingModule;
	let service: ToolReferenceService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolVersionService: DeepMocked<ToolConfigurationStatusService>;
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
		toolVersionService = module.get(ToolConfigurationStatusService);
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
				const contextExternalToolId = new ObjectId().toHexString();
				const externalTool = externalToolFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id as string,
				}) as SchoolExternalToolWithId;
				const contextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id)
					.buildWithId(undefined, contextExternalToolId);
				const logoUrl = 'logoUrl';

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				toolVersionService.determineToolConfigurationStatus.mockReturnValue(
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
				};
			};

			it('should determine the tool status', async () => {
				const { contextExternalToolId, externalTool, schoolExternalTool, contextExternalTool } = setup();

				await service.getToolReference(contextExternalToolId);

				expect(toolVersionService.determineToolConfigurationStatus).toHaveBeenCalledWith(
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
