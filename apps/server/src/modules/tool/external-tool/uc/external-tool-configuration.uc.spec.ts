import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolDO, ExternalToolDO, Page, Permission, SchoolExternalToolDO, User } from '@shared/domain';
import { contextExternalToolDOFactory, setupEntities, userFactory } from '@shared/testing';
import { externalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing/factory';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '../../common/interface';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalToolService } from '../service';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
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
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
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
					provide: ToolFeatures,
					useValue: {
						contextConfigurationEnabled: false,
					},
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
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
			const setupAuthorization = () => {
				const user: User = userFactory.buildWithId();
				const schoolId = 'schoolId';

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				return {
					user,
					schoolId,
				};
			};

			it('should call the authorizationService with SCHOOL_TOOL_ADMIN permission', async () => {
				const { user, schoolId } = setupAuthorization();

				await uc.getAvailableToolsForSchool(user.id, 'schoolId');

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.School,
					schoolId,
					{
						action: Action.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});

			it('should fail when authorizationService throws ForbiddenException', async () => {
				setupAuthorization();

				authorizationService.checkPermissionByReferences.mockImplementation(() => {
					throw new ForbiddenException();
				});

				const func = uc.getAvailableToolsForSchool('userId', 'schoolId');

				await expect(func).rejects.toThrow(ForbiddenException);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			it('should filter tools that are already in use', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId(undefined, 'usedToolId'),
					externalToolDOFactory.buildWithId(undefined, 'unusedToolId'),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue(
					schoolExternalToolDOFactory.buildList(1, { toolId: 'usedToolId' })
				);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should filter tools that are hidden', async () => {
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId({ isHidden: true }),
					externalToolDOFactory.buildWithId({ isHidden: false }),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toHaveLength(1);
			});

			it('should return a list of available external tools', async () => {
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(result).toEqual(externalToolDOs);
			});
		});
	});

	describe('getAvailableToolsForContext is called', () => {
		describe('when the user has insufficient permission', () => {
			const setup = () => {
				authorizationService.checkPermissionByReferences.mockRejectedValue(new ForbiddenException());
			};

			it('should fail when authorizationService throws ForbiddenException', async () => {
				setup();

				const func = async () =>
					uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				await expect(func).rejects.toThrow(ForbiddenException);
				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					'userId',
					AuthorizableReferenceType.Course,
					'contextId',
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					}
				);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const hiddenTool: ExternalToolDO = externalToolDOFactory.buildWithId({ isHidden: true });
				const usedTool: ExternalToolDO = externalToolDOFactory.buildWithId({ isHidden: false }, 'usedToolId');
				const unusedTool: ExternalToolDO = externalToolDOFactory.buildWithId({ isHidden: false }, 'unusedToolId');
				const toolWithoutSchoolTool: ExternalToolDO = externalToolDOFactory.buildWithId(
					{ isHidden: false },
					'noSchoolTool'
				);

				const usedSchoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
					id: 'usedSchoolExternalToolId',
					toolId: 'usedToolId',
				});
				const unusedSchoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
					id: 'unusedSchoolExternalTool',
					toolId: 'unusedToolId',
				});

				const usedContextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({
					schoolToolRef: { schoolToolId: 'usedSchoolExternalToolId' },
				});

				const externalTool = unusedTool;
				const schoolExternalTool = unusedSchoolExternalTool;

				externalToolService.findExternalTools.mockResolvedValue(
					new Page<ExternalToolDO>([hiddenTool, usedTool, unusedTool, toolWithoutSchoolTool], 4)
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
					externalTool,
					schoolExternalTool,
				};
			};

			it('should call the authorizationService with CONTEXT_TOOL_ADMIN permission', async () => {
				setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					'userId',
					AuthorizableReferenceType.Course,
					'contextId',
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					}
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
				const { externalTool, schoolExternalTool } = setup();

				const availableTools = await uc.getAvailableToolsForContext(
					'userId',
					'schoolId',
					'contextId',
					ToolContextType.COURSE
				);

				expect(availableTools).toEqual([
					{
						externalTool,
						schoolExternalTool,
					},
				]);
			});
		});

		describe('when there are no available tools', () => {
			const setup = () => {
				const toolWithoutSchoolTool: ExternalToolDO = externalToolDOFactory.buildWithId(
					{ isHidden: false },
					'noSchoolTool'
				);

				const unusedSchoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
					id: 'unusedSchoolExternalTool',
					toolId: 'unusedToolId',
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>([toolWithoutSchoolTool], 1));
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

				const usedTool: ExternalToolDO = externalToolDOFactory.buildWithId({ isHidden: false }, 'usedToolId');

				const usedSchoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.build({
					id: 'usedSchoolExternalToolId',
					toolId: 'usedToolId',
				});

				const usedContextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId({
					schoolToolRef: { schoolToolId: 'usedSchoolExternalToolId' },
				});

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>([usedTool], 1));
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
	});

	describe('getTemplateForSchoolExternalTool is called', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const externalTool: ExternalToolDO = externalToolDOFactory.buildWithId();

				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId(
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
				};
			};

			it('should successfully check the user permission with the authorization service', async () => {
				const { schoolExternalToolId } = setup();

				await uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					'userId',
					AuthorizableReferenceType.School,
					'schoolId',
					{
						action: Action.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
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
				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId(
					undefined,
					schoolExternalToolId
				);

				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.checkPermissionByReferences.mockImplementation(() => {
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
				const externalTool: ExternalToolDO = externalToolDOFactory.buildWithId({
					isHidden: true,
				});

				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId(
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
	});

	describe('getTemplateForContextExternalTool is called', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const externalTool: ExternalToolDO = externalToolDOFactory.buildWithId();

				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({
					toolId: externalTool.id,
				});

				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId(
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

			it('should successfully check the user permission with the authorization service', async () => {
				const { contextExternalToolId, contextExternalTool } = setup();

				await uc.getTemplateForContextExternalTool('userId', contextExternalToolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					'userId',
					AuthorizableReferenceType.Course,
					contextExternalTool.contextRef.id,
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					}
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
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId(
					undefined,
					contextExternalToolId
				);

				contextExternalToolService.getContextExternalToolById.mockResolvedValueOnce(contextExternalTool);
				authorizationService.checkPermissionByReferences.mockImplementation(() => {
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
				const externalTool: ExternalToolDO = externalToolDOFactory.buildWithId({
					isHidden: true,
				});

				const schoolExternalTool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId({
					toolId: externalTool.id,
				});

				const contextExternalToolId: string = new ObjectId().toHexString();
				const contextExternalTool: ContextExternalToolDO = contextExternalToolDOFactory.buildWithId(
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
	});
});
