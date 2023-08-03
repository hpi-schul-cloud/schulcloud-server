import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Permission } from '@shared/domain';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { ForbiddenException } from '@nestjs/common';
import { Action } from '@src/modules/authorization';
import { ToolReferenceUc } from './tool-reference.uc';
import { ToolConfigurationStatus, ToolContextType } from '../../common/enum';
import { ExternalToolService } from '../service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { CommonToolService } from '../../common/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, ToolReference } from '../domain';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolUc } from '../../context-external-tool/uc';

describe('ToolReferenceUc', () => {
	let module: TestingModule;
	let uc: ToolReferenceUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let contextExternalToolUc: DeepMocked<ContextExternalToolUc>;
	let commonToolService: DeepMocked<CommonToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolReferenceUc,
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
			],
		}).compile();

		uc = module.get(ToolReferenceUc);

		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		contextExternalToolUc = module.get(ContextExternalToolUc);
		commonToolService = module.get(CommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getToolReferences', () => {
		describe('when called with a context type and id', () => {
			const setup = () => {
				const userId = 'userId';

				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef('schoolToolId', 'schoolId')
					.buildWithId();

				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId = 'contextId';

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalTool]);
				contextExternalToolUc.ensureContextPermissions.mockResolvedValueOnce();
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);
				commonToolService.determineToolConfigurationStatus.mockReturnValueOnce(ToolConfigurationStatus.LATEST);

				return {
					userId,
					contextType,
					contextId,
					contextExternalTool,
					schoolExternalTool,
					externalTool,
					externalToolId: externalTool.id as string,
				};
			};

			it('should call contextExternalToolService.ensureContextPermissions', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId);

				expect(contextExternalToolUc.ensureContextPermissions).toHaveBeenCalledWith(userId, contextExternalTool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_USER],
					action: Action.read,
				});
			});

			it('should call contextExternalToolService.findAllByContext', async () => {
				const { userId, contextType, contextId } = setup();

				await uc.getToolReferences(userId, contextType, contextId);

				expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith({
					type: contextType,
					id: contextId,
				});
			});

			it('should call schoolExternalToolService.findByExternalToolId', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId);

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					contextExternalTool.schoolToolRef.schoolToolId
				);
			});

			it('should call externalToolService.findById', async () => {
				const { userId, contextType, contextId, externalToolId } = setup();

				await uc.getToolReferences(userId, contextType, contextId);

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(externalToolId);
			});

			it('should call commonToolService.determineToolConfigurationStatus', async () => {
				const { userId, contextType, contextId, contextExternalTool, schoolExternalTool, externalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId);

				expect(commonToolService.determineToolConfigurationStatus).toHaveBeenCalledWith(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);
			});

			it('should return a list of tool references', async () => {
				const { userId, contextType, contextId, contextExternalTool, externalTool } = setup();

				const result: ToolReference[] = await uc.getToolReferences(userId, contextType, contextId);

				expect(result).toEqual<ToolReference[]>([
					{
						logoUrl: externalTool.logoUrl,
						openInNewTab: externalTool.openNewTab,
						contextToolId: contextExternalTool.id as string,
						displayName: contextExternalTool.displayName as string,
						status: ToolConfigurationStatus.LATEST,
					},
				]);
			});
		});

		describe('when user does not have permission to a tool', () => {
			const setup = () => {
				const userId = 'userId';

				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef('schoolToolId', 'schoolId')
					.buildWithId();

				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId = 'contextId';

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalTool]);
				contextExternalToolUc.ensureContextPermissions.mockRejectedValueOnce(new ForbiddenException());
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);

				return {
					userId,
					contextType,
					contextId,
				};
			};

			it('should filter out tool references if a ForbiddenException is thrown', async () => {
				const { userId, contextType, contextId } = setup();

				const result: ToolReference[] = await uc.getToolReferences(userId, contextType, contextId);

				expect(result).toEqual<ToolReference[]>([]);
			});
		});
	});
});
