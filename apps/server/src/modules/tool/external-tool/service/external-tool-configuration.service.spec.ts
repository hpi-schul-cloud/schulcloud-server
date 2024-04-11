import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	schoolToolConfigurationStatusFactory,
	setupEntities,
} from '@shared/testing';
import { CustomParameter } from '../../common/domain';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ContextExternalToolTemplateInfo } from '../uc';
import { ExternalToolConfigurationService } from './external-tool-configuration.service';

describe('ExternalToolConfigurationService', () => {
	let module: TestingModule;
	let service: ExternalToolConfigurationService;
	let commonToolService: DeepMocked<CommonToolService>;

	let toolFeatures: IToolFeatures;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolConfigurationService,
				{
					provide: ToolFeatures,
					useValue: {
						contextConfigurationEnabled: false,
					},
				},
				{
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
				},
			],
		}).compile();

		service = module.get(ExternalToolConfigurationService);
		toolFeatures = module.get(ToolFeatures);
		commonToolService = module.get(CommonToolService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('filterForAvailableTools', () => {
		describe('when tools are given', () => {
			const setup = () => {
				const notHiddenTools = [
					externalToolFactory.buildWithId(undefined, 'usedToolId'),
					externalToolFactory.buildWithId(undefined, 'unusedToolId'),
				];

				const externalTools: ExternalTool[] = [
					...notHiddenTools,
					externalToolFactory.buildWithId({ isHidden: true }, 'hiddenToolId'),
					externalToolFactory.buildWithId({ isDeactivated: true }, 'deactivatedToolId'),
				];
				const externalToolsPage: Page<ExternalTool> = new Page<ExternalTool>(externalTools, externalTools.length);
				const toolIdsInUse: EntityId[] = ['usedToolId', 'hiddenToolId'];

				return { externalToolsPage, toolIdsInUse, notHiddenTools };
			};

			it('should filter out hidden tools', () => {
				const { externalToolsPage, toolIdsInUse } = setup();

				const result: ExternalTool[] = service.filterForAvailableTools(externalToolsPage, toolIdsInUse);

				expect(result.some((tool) => tool.id === 'usedToolId')).toBe(false);
			});

			it('should include unused tools', () => {
				const { externalToolsPage, toolIdsInUse } = setup();

				const result: ExternalTool[] = service.filterForAvailableTools(externalToolsPage, toolIdsInUse);

				expect(result.some((tool) => tool.id === 'unusedToolId')).toBe(true);
			});

			it('should not filter tools when none are in use', () => {
				const { externalToolsPage, notHiddenTools } = setup();

				const result: ExternalTool[] = service.filterForAvailableTools(externalToolsPage, []);

				expect(result.length).toBe(notHiddenTools.length);
			});

			it('should filter out deactivated tools', () => {
				const { externalToolsPage, toolIdsInUse } = setup();

				const result: ExternalTool[] = service.filterForAvailableTools(externalToolsPage, toolIdsInUse);

				expect(result.some((tool) => tool.id !== 'deactivatedToolId')).toBe(true);
			});
		});
	});

	describe('filterForAvailableSchoolExternalTools', () => {
		describe('when context configuration is enabled', () => {
			const setup = () => {
				toolFeatures.contextConfigurationEnabled = true;
				const usedSchoolExternalToolId = 'usedSchoolExternalToolId';
				const schoolExternalTools: SchoolExternalTool[] = [
					schoolExternalToolFactory.buildWithId(undefined, usedSchoolExternalToolId),
					schoolExternalToolFactory.buildWithId(undefined, 'unusedSchoolExternalToolId'),
				];
				const contextExternalToolsInUse: ContextExternalTool[] = [
					contextExternalToolFactory.withSchoolExternalToolRef(usedSchoolExternalToolId).buildWithId(),
					contextExternalToolFactory.buildWithId(undefined, 'unusedContextExternalToolId'),
				];

				return { schoolExternalTools, contextExternalToolsInUse };
			};

			it('should include all school external tools', () => {
				const { schoolExternalTools, contextExternalToolsInUse } = setup();

				const result: SchoolExternalTool[] = service.filterForAvailableSchoolExternalTools(
					schoolExternalTools,
					contextExternalToolsInUse
				);

				expect(result).toEqual(schoolExternalTools);
			});
		});

		describe('when context configuration is disabled', () => {
			const setup = () => {
				toolFeatures.contextConfigurationEnabled = false;
				const usedSchoolExternalToolId = 'usedSchoolExternalToolId';
				const unusedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					undefined,
					'unusedSchoolExternalToolId'
				);
				const schoolExternalTools: SchoolExternalTool[] = [
					schoolExternalToolFactory.buildWithId(undefined, usedSchoolExternalToolId),
					unusedSchoolExternalTool,
				];
				const contextExternalToolsInUse: ContextExternalTool[] = [
					contextExternalToolFactory.withSchoolExternalToolRef(usedSchoolExternalToolId).buildWithId(),
					contextExternalToolFactory.buildWithId(undefined, 'unusedContextExternalToolId'),
				];

				return { schoolExternalTools, contextExternalToolsInUse, unusedSchoolExternalTool };
			};

			it('should filter out school external tools in use', () => {
				const { schoolExternalTools, contextExternalToolsInUse, unusedSchoolExternalTool } = setup();

				const result: SchoolExternalTool[] = service.filterForAvailableSchoolExternalTools(
					schoolExternalTools,
					contextExternalToolsInUse
				);

				expect(result).toEqual([unusedSchoolExternalTool]);
			});
		});
	});

	describe('filterForAvailableExternalTools', () => {
		describe('when filtering for available external tools', () => {
			const setup = () => {
				const usedExternalToolId = 'usedToolId';
				const usedExternalToolHiddenId = 'usedToolId';
				const externalTools: ExternalTool[] = [
					externalToolFactory.buildWithId(undefined, usedExternalToolId),
					externalToolFactory.buildWithId(undefined, 'unusedToolId'),
					externalToolFactory.buildWithId({ isHidden: true }, usedExternalToolHiddenId),
				];
				const availableSchoolExternalTools: SchoolExternalTool[] = [
					schoolExternalToolFactory.buildWithId({ toolId: usedExternalToolId }, 'usedSchoolExternalToolId'),
					schoolExternalToolFactory.buildWithId(undefined, 'unusedSchoolExternalToolId'),
					schoolExternalToolFactory.buildWithId(undefined, 'deactivatedToolId'),
					schoolExternalToolFactory.buildWithId(undefined, 'deactivatedToolId'),
					schoolExternalToolFactory.buildWithId(undefined, 'deactivatedToolId'),
					schoolExternalToolFactory.buildWithId(undefined, 'unusedSchoolExternalToolId'),
					schoolExternalToolFactory.buildWithId({ toolId: usedExternalToolHiddenId }, 'usedSchoolExternalToolHiddenId'),
				];

				availableSchoolExternalTools.forEach((tool): void => {
					if (tool.id === 'deactivatedToolId') {
						tool.status = schoolToolConfigurationStatusFactory.build({
							isDeactivated: true,
							isOutdatedOnScopeSchool: false,
						});
					}
					tool.status = schoolToolConfigurationStatusFactory.build({
						isDeactivated: false,
						isOutdatedOnScopeSchool: false,
					});
				});

				return { externalTools, availableSchoolExternalTools };
			};

			it('should filter out hidden external tools', () => {
				const { externalTools, availableSchoolExternalTools } = setup();

				const result: ContextExternalToolTemplateInfo[] = service.filterForAvailableExternalTools(
					externalTools,
					availableSchoolExternalTools
				);

				expect(result.every((toolInfo: ContextExternalToolTemplateInfo) => !toolInfo.externalTool.isHidden)).toBe(true);
			});

			it('should filter out deactivated external tools', () => {
				const { externalTools, availableSchoolExternalTools } = setup();

				const result: ContextExternalToolTemplateInfo[] = service.filterForAvailableExternalTools(
					externalTools,
					availableSchoolExternalTools
				);

				expect(result.every((toolInfo: ContextExternalToolTemplateInfo) => !toolInfo.externalTool.isDeactivated)).toBe(
					true
				);
			});

			it('should filter out deactivated school external tools', () => {
				const { externalTools, availableSchoolExternalTools } = setup();

				const result: ContextExternalToolTemplateInfo[] = service.filterForAvailableExternalTools(
					externalTools,
					availableSchoolExternalTools
				);

				expect(
					result.every(
						(toolInfo: ContextExternalToolTemplateInfo) => !toolInfo.schoolExternalTool.status?.isDeactivated
					)
				).toBe(true);
			});
		});
	});

	describe('filterForContextRestrictions', () => {
		describe('when tool has no context restrictions', () => {
			const setup = () => {
				const contextType = ToolContextType.COURSE;

				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();

				const availableTools: ContextExternalToolTemplateInfo[] = [{ externalTool, schoolExternalTool }];

				commonToolService.isContextRestricted.mockReturnValueOnce(false);

				return {
					contextType,
					availableTools,
				};
			};

			it('should check if context is restricted', () => {
				const { contextType, availableTools } = setup();

				service.filterForContextRestrictions(availableTools, contextType);

				expect(commonToolService.isContextRestricted).toHaveBeenCalledWith(availableTools[0].externalTool, contextType);
			});

			it('should pass the filter', () => {
				const { contextType, availableTools } = setup();

				const result: ContextExternalToolTemplateInfo[] = service.filterForContextRestrictions(
					availableTools,
					contextType
				);

				expect(result).toEqual(availableTools);
			});
		});

		describe('when context restrictions are given', () => {
			const setup = () => {
				const contextType: ToolContextType = ToolContextType.COURSE;

				const externalToolWithCourseRestriction: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.COURSE],
				});
				const externalToolWithBoardRestriction: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();

				const availableTools: ContextExternalToolTemplateInfo[] = [
					{ externalTool: externalToolWithCourseRestriction, schoolExternalTool },
					{ externalTool: externalToolWithBoardRestriction, schoolExternalTool },
				];

				commonToolService.isContextRestricted.mockReturnValueOnce(false);
				commonToolService.isContextRestricted.mockReturnValueOnce(true);

				return {
					contextType,
					availableTools,
					externalToolWithCourseRestriction,
					schoolExternalTool,
				};
			};

			it('should only return tools restricted to this context', () => {
				const { contextType, availableTools, externalToolWithCourseRestriction, schoolExternalTool } = setup();

				const result: ContextExternalToolTemplateInfo[] = service.filterForContextRestrictions(
					availableTools,
					contextType
				);

				expect(result).toEqual<ContextExternalToolTemplateInfo[]>([
					{ externalTool: externalToolWithCourseRestriction, schoolExternalTool },
				]);
			});
		});
	});

	describe('filterParametersForScope', () => {
		describe('when filtering parameters for scope', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({
					id: 'externalToolId',
					parameters: [
						customParameterFactory.build({ name: 'schoolParam', scope: CustomParameterScope.SCHOOL }),
						customParameterFactory.build({ name: 'contextParam', scope: CustomParameterScope.CONTEXT }),
					],
				});
				const scope = CustomParameterScope.CONTEXT;

				return { externalTool, scope };
			};

			it('should filter parameters for the given scope', () => {
				const { externalTool, scope } = setup();

				service.filterParametersForScope(externalTool, scope);

				expect(externalTool.parameters?.every((parameter: CustomParameter) => parameter.scope === scope)).toBe(true);
			});
		});
	});

	describe('getToolContextTypes', () => {
		describe('when it is called', () => {
			it('should return ToolContextTypes', () => {
				const types: ToolContextType[] = service.getToolContextTypes();

				expect(types).toEqual([
					ToolContextType.COURSE,
					ToolContextType.BOARD_ELEMENT,
					ToolContextType.MEDIA_BOARD_ELEMENT,
				]);
			});
		});
	});
});
