import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page, Permission } from '@shared/domain';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	schoolExternalToolFactory,
	setupEntities,
} from '@shared/testing';
import { AuthorizationContextBuilder } from '@src/modules/authorization';
import { ToolContextType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolService } from '../service';
import { ContextExternalToolTemplateInfo } from './dto';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let toolFeatures: IToolFeatures;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				ExternalToolConfigurationUc,
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
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						contextConfigurationEnabled: false,
					},
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		toolFeatures = module.get(ToolFeatures);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool is called', () => {
		describe('when checking for the users permission', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.build();

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);

				return {
					tool,
				};
			};

			it('should call the toolPermissionHelper with SCHOOL_TOOL_ADMIN permission', async () => {
				const { tool } = setup();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					'userId',
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when toolPermissionHelper throws ForbiddenException', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.build();

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);
				toolPermissionHelper.ensureSchoolPermissions.mockImplementation(() => {
					throw new ForbiddenException();
				});
			};

			it('should fail', async () => {
				setup();

				const func = uc.getAvailableToolsForSchool('userId', 'schoolId');

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when getting the list of external tools that can be added to a school with used tools', () => {
			const setup = () => {
				const externalTools: ExternalTool[] = [
					externalToolFactory.buildWithId(undefined, 'usedToolId'),
					externalToolFactory.buildWithId(undefined, 'unusedToolId'),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>(externalTools, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue(
					schoolExternalToolFactory.buildList(1, { toolId: 'usedToolId' })
				);
			};

			it('should filter tools that are already in use', async () => {
				setup();

				const result: ExternalTool[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});
		});

		describe('when getting the list of external tools that can be added to a school with hidden tools', () => {
			const setup = () => {
				const externalToolDOs: ExternalTool[] = [
					externalToolFactory.buildWithId({ isHidden: true }),
					externalToolFactory.buildWithId({ isHidden: false }),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);
			};

			it('should filter tools that are hidden', async () => {
				setup();

				const result: ExternalTool[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});
		});

		describe('when getting the list of external tools that can be added to a school with scope school', () => {
			const setup = () => {
				const externalToolDOs: ExternalTool[] = externalToolFactory.buildListWithId(2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>(externalToolDOs, 1));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				return { externalToolDOs };
			};

			it('should return a list of available external tools with parameters for only for scope school', async () => {
				const { externalToolDOs } = setup();

				const result: ExternalTool[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toEqual(externalToolDOs);
			});
		});

		describe('when an available external tool has parameters', () => {
			const setup = () => {
				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([externalTool], 1));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				return {
					schoolParameter,
				};
			};

			it('should only return parameters for scope school', async () => {
				const { schoolParameter } = setup();

				const result: ExternalTool[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result[0].parameters).toEqual([schoolParameter]);
			});
		});
	});

	describe('getAvailableToolsForContext is called', () => {
		describe('when the user has insufficient permission', () => {
			const setup = () => {
				const tool: ContextExternalTool = contextExternalToolFactory.build();

				toolPermissionHelper.ensureContextPermissions.mockRejectedValue(new ForbiddenException());
				contextExternalToolService.findContextExternalTools.mockResolvedValue([tool]);

				return { tool };
			};

			it('should fail when authorizationService throws ForbiddenException', async () => {
				const { tool } = setup();

				const func = async () =>
					uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				await expect(func).rejects.toThrow(ForbiddenException);
				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					'userId',
					tool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const hiddenTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: true });
				const usedTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: false }, 'usedToolId');
				const unusedTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: false }, 'unusedToolId');
				const toolWithoutSchoolTool: ExternalTool = externalToolFactory.buildWithId(
					{ isHidden: false },
					'noSchoolTool'
				);

				const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					id: 'usedSchoolExternalToolId',
					toolId: 'usedToolId',
				});
				const unusedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					id: 'unusedSchoolExternalTool',
					toolId: 'unusedToolId',
				});

				const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolToolRef: { schoolToolId: 'usedSchoolExternalToolId' },
				});

				externalToolService.findExternalTools.mockResolvedValue(
					new Page<ExternalTool>([hiddenTool, usedTool, unusedTool, toolWithoutSchoolTool], 4)
				);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([
					usedSchoolExternalTool,
					unusedSchoolExternalTool,
				]);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([usedContextExternalTool]);

				return {
					hiddenTool,
					usedTool,
					unusedTool,
					toolWithoutSchoolTool,
					usedSchoolExternalTool,
					unusedSchoolExternalTool,
					usedContextExternalTool,
				};
			};

			it('should call the authorizationService with CONTEXT_TOOL_ADMIN permission', async () => {
				const { usedContextExternalTool } = setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					'userId',
					usedContextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should filter tools that are already in use', async () => {
				const { usedTool, usedSchoolExternalTool } = setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).not.toContain(usedTool);
				expect(availableTools).not.toContain(usedSchoolExternalTool);
			});

			it('should filter tools that are hidden', async () => {
				const { hiddenTool } = setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).not.toContain(hiddenTool);
			});

			it('should filter tools that have no SchoolExternalTool', async () => {
				const { toolWithoutSchoolTool } = setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).not.toContain(toolWithoutSchoolTool);
			});

			it('should return a list of available external tools', async () => {
				const { unusedTool, unusedSchoolExternalTool } = setup();

				const availableTools: ContextExternalToolTemplateInfo[] = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).toEqual<ContextExternalToolTemplateInfo[]>([
					{
						externalTool: unusedTool,
						schoolExternalTool: unusedSchoolExternalTool,
					},
				]);
			});
		});

		describe('when there are no available tools', () => {
			const setup = () => {
				const toolWithoutSchoolTool: ExternalTool = externalToolFactory.buildWithId(
					{ isHidden: false },
					'noSchoolTool'
				);

				const unusedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					id: 'unusedSchoolExternalTool',
					toolId: 'unusedToolId',
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([toolWithoutSchoolTool], 1));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([unusedSchoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([]);

				return {};
			};

			it('should return empty array', async () => {
				setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).toEqual([]);
			});
		});

		describe('when configuration of context external tools is enabled', () => {
			const setup = () => {
				toolFeatures.contextConfigurationEnabled = true;

				const usedTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: false }, 'usedToolId');

				const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					id: 'usedSchoolExternalToolId',
					toolId: 'usedToolId',
				});

				const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolToolRef: { schoolToolId: 'usedSchoolExternalToolId' },
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([usedTool], 1));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([usedSchoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([usedContextExternalTool]);

				return {
					usedTool,
					usedSchoolExternalTool,
				};
			};

			it('should allow to add one tool multiple times to a school', async () => {
				const { usedTool, usedSchoolExternalTool } = setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).toEqual([
					{
						externalTool: usedTool,
						schoolExternalTool: usedSchoolExternalTool,
					},
				]);
			});
		});

		describe('when an available external tool has parameters', () => {
			const setup = () => {
				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([externalTool], 1));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool]);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([]);

				return {
					contextParameter,
				};
			};

			it('should only return parameters for scope context', async () => {
				const { contextParameter } = setup();

				const result: ContextExternalToolTemplateInfo[] = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(result[0].externalTool.parameters).toEqual([contextParameter]);
			});
		});
	});

	describe('getTemplateForSchoolExternalTool is called', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					{
						toolId: externalTool.id,
						schoolId: 'schoolId',
					},
					schoolExternalToolId
				);

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
					schoolExternalToolId,
					schoolExternalTool,
				};
			};

			it('should successfully check the user permission with the authorization service', async () => {
				const { schoolExternalToolId, schoolExternalTool } = setup();

				await uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					'userId',
					schoolExternalTool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});

			it('should return the external tool', async () => {
				const { schoolExternalToolId, externalTool } = setup();

				const result = await uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when the user has insufficient permission to read an external tool', () => {
			const setup = () => {
				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					undefined,
					schoolExternalToolId
				);

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				toolPermissionHelper.ensureSchoolPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				return {
					schoolExternalToolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { schoolExternalToolId } = setup();

				const result = uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when tool is hidden', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					isHidden: true,
				});

				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId(
					{
						toolId: externalTool.id,
						schoolId: 'schoolId',
					},
					schoolExternalToolId
				);

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);

				return {
					schoolExternalToolId,
				};
			};

			it(' should throw NotFoundException', async () => {
				const { schoolExternalToolId } = setup();

				const result = uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});

		describe('when an available external tool has parameters', () => {
			const setup = () => {
				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);

				return {
					schoolParameter,
				};
			};

			it('should only return parameters for scope school', async () => {
				const { schoolParameter } = setup();

				const result: ExternalTool = await uc.getTemplateForSchoolExternalTool('userId', 'schoolExternalToolId');

				expect(result.parameters).toEqual([schoolParameter]);
			});
		});
	});

	describe('getTemplateForContextExternalTool is called', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});

				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					{
						schoolToolRef: {
							schoolToolId: schoolExternalTool.schoolId,
						},
						contextRef: {
							id: new ObjectId().toHexString(),
							type: ToolContextType.COURSE,
						},
					},
					contextExternalToolId
				);

				contextExternalToolService.getContextExternalToolById.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);

				return {
					externalTool,
					contextExternalTool,
					contextExternalToolId,
				};
			};

			it('should successfully check the user permission with the toolPermissionHelper', async () => {
				const { contextExternalToolId, contextExternalTool } = setup();

				await uc.getTemplateForContextExternalTool('userId', contextExternalToolId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					'userId',
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should return the external tool', async () => {
				const { contextExternalToolId, externalTool } = setup();

				const result = await uc.getTemplateForSchoolExternalTool('userId', contextExternalToolId);

				expect(result).toEqual(externalTool);
			});
		});

		describe('when the user has insufficient permission to read an external tool', () => {
			const setup = () => {
				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					undefined,
					contextExternalToolId
				);

				contextExternalToolService.getContextExternalToolById.mockResolvedValueOnce(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				return {
					contextExternalToolId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { contextExternalToolId } = setup();

				const result = uc.getTemplateForContextExternalTool('userId', contextExternalToolId);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when tool is hidden', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					isHidden: true,
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					toolId: externalTool.id,
				});

				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					{
						schoolToolRef: {
							schoolToolId: schoolExternalTool.schoolId,
						},
					},
					contextExternalToolId
				);

				contextExternalToolService.getContextExternalToolById.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValueOnce(externalTool);

				return {
					contextExternalToolId,
				};
			};

			it(' should throw NotFoundException', async () => {
				const { contextExternalToolId } = setup();

				const result = uc.getTemplateForContextExternalTool('userId', contextExternalToolId);

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});

		describe('when an available external tool has parameters', () => {
			const setup = () => {
				const [globalParameter, schoolParameter, contextParameter] = customParameterFactory.buildListWithEachType();

				const externalTool: ExternalTool = externalToolFactory.buildWithId({
					parameters: [globalParameter, schoolParameter, contextParameter],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					toolId: externalTool.id,
				});
				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId(
					{
						schoolToolRef: {
							schoolToolId: schoolExternalTool.schoolId,
						},
					},
					contextExternalToolId
				);

				contextExternalToolService.getContextExternalToolById.mockResolvedValue(contextExternalTool);
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(schoolExternalTool);
				externalToolService.findExternalToolById.mockResolvedValue(externalTool);

				return {
					contextParameter,
					contextExternalToolId,
				};
			};

			it('should only return parameters for scope school', async () => {
				const { contextParameter, contextExternalToolId } = setup();

				const result: ContextExternalToolTemplateInfo = await uc.getTemplateForContextExternalTool(
					'userId',
					contextExternalToolId
				);

				expect(result.externalTool.parameters).toEqual([contextParameter]);
			});
		});
	});
});
