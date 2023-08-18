import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { contextExternalToolFactory, externalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { AuthorizationContextBuilder } from '@src/modules/authorization';
import { ToolReferenceUc } from './tool-reference.uc';
import { ToolConfigurationStatus, ToolContextType } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalTool, ToolReference } from '../domain';
import { ExternalToolService } from '../service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

describe('ToolReferenceUc', () => {
	let module: TestingModule;
	let uc: ToolReferenceUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
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
				{
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
			],
		}).compile();

		uc = module.get(ToolReferenceUc);

		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		commonToolService = module.get(CommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getToolReferences', () => {
		describe('when called with a context type and id', () => {
			const setup = () => {
				const userId = 'userId';

				const externalTool: ExternalTool = externalToolFactory.withBase64Logo().buildWithId();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef('schoolToolId', 'schoolId')
					.buildWithId();

				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId = 'contextId';

				contextExternalToolService.findAllByContext.mockResolvedValueOnce([contextExternalTool]);
				toolPermissionHelper.ensureContextPermissions.mockResolvedValueOnce();
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

			it('should call toolPermissionHelper.ensureContextPermissions', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId, '/v3/tools/external-tools/{id}/logo');

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					userId,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER])
				);
			});

			it('should call contextExternalToolService.findAllByContext', async () => {
				const { userId, contextType, contextId } = setup();

				await uc.getToolReferences(userId, contextType, contextId, '/v3/tools/external-tools/{id}/logo');

				expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith({
					type: contextType,
					id: contextId,
				});
			});

			it('should call schoolExternalToolService.findByExternalToolId', async () => {
				const { userId, contextType, contextId, contextExternalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId, '/v3/tools/external-tools/{id}/logo');

				expect(schoolExternalToolService.getSchoolExternalToolById).toHaveBeenCalledWith(
					contextExternalTool.schoolToolRef.schoolToolId
				);
			});

			it('should call externalToolService.findById', async () => {
				const { userId, contextType, contextId, externalToolId } = setup();

				await uc.getToolReferences(userId, contextType, contextId, '/v3/tools/external-tools/{id}/logo');

				expect(externalToolService.findExternalToolById).toHaveBeenCalledWith(externalToolId);
			});

			it('should call commonToolService.determineToolConfigurationStatus', async () => {
				const { userId, contextType, contextId, contextExternalTool, schoolExternalTool, externalTool } = setup();

				await uc.getToolReferences(userId, contextType, contextId, '/v3/tools/external-tools/{id}/logo');

				expect(commonToolService.determineToolConfigurationStatus).toHaveBeenCalledWith(
					externalTool,
					schoolExternalTool,
					contextExternalTool
				);
			});

			it('should return a list of tool references', async () => {
				const { userId, contextType, contextId, contextExternalTool, externalTool } = setup();

				const result: ToolReference[] = await uc.getToolReferences(
					userId,
					contextType,
					contextId,
					'/v3/tools/external-tools/{id}/logo'
				);

				expect(result).toEqual<ToolReference[]>([
					{
						logoUrl: `${Configuration.get('PUBLIC_BACKEND_URL') as string}/v3/tools/external-tools/${
							externalTool.id as string
						}/logo`,
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
				toolPermissionHelper.ensureContextPermissions.mockRejectedValueOnce(new ForbiddenException());
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

				const result: ToolReference[] = await uc.getToolReferences(
					userId,
					contextType,
					contextId,
					'/v3/tools/external-tools/{id}/logo'
				);

				expect(result).toEqual<ToolReference[]>([]);
			});
		});
	});
});
