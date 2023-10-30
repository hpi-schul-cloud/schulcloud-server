import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { contextExternalToolFactory } from '@shared/testing/factory/domainobject/tool/context-external-tool.factory';
import { externalToolFactory } from '@shared/testing/factory/domainobject/tool/external-tool.factory';
import { schoolExternalToolFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { ToolConfigurationStatus } from '../../common/enum/tool-configuration-status';
import { CommonToolService } from '../../common/service/common-tool.service';
import { ExternalToolLogoService } from '../../external-tool/service/external-tool-logo.service';
import { ExternalToolService } from '../../external-tool/service/external-tool.service';
import { SchoolExternalToolService } from '../../school-external-tool/service/school-external-tool.service';
import { ToolReference } from '../domain/tool-reference';
import { ContextExternalToolService } from './context-external-tool.service';
import { ToolReferenceService } from './tool-reference.service';

describe('ToolReferenceService', () => {
	let module: TestingModule;
	let service: ToolReferenceService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let commonToolService: DeepMocked<CommonToolService>;
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
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
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
		commonToolService = module.get(CommonToolService);
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
	});
});
