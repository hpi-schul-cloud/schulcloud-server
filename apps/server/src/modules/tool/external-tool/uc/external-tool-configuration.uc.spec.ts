import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { schoolFactory } from '@modules/school/testing';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities, userFactory } from '@shared/testing';
import { School, SchoolService } from '@src/modules/school';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalToolService } from '../../context-external-tool';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ExternalTool } from '../domain';
import { ExternalToolConfigurationService, ExternalToolLogoService, ExternalToolService } from '../service';
import { customParameterFactory, externalToolFactory } from '../testing';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let externalToolConfigurationService: DeepMocked<ExternalToolConfigurationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let logoService: DeepMocked<ExternalToolLogoService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

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
					provide: ExternalToolConfigurationService,
					useValue: createMock<ExternalToolConfigurationService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		externalToolConfigurationService = module.get(ExternalToolConfigurationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		logoService = module.get(ExternalToolLogoService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool', () => {
		describe('when checking for the users permission', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.build();
				const user: User = userFactory.build();

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);

				return {
					tool,
					user,
				};
			};

			it('should check for SCHOOL_TOOL_ADMIN permission', async () => {
				const { tool, user } = setup();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when permission check throws ForbiddenException', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.build();

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>([], 0));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);
				authorizationService.checkPermission.mockImplementation(() => {
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
				const externalToolsPage: Page<ExternalTool> = new Page<ExternalTool>(externalTools, 2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalTool>(externalTools, 2));
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue(
					schoolExternalToolFactory.buildList(1, { toolId: 'usedToolId' })
				);
				externalToolConfigurationService.filterForAvailableTools.mockReturnValue(externalTools);

				return { externalToolsPage };
			};

			it('should call externalToolLogoService', async () => {
				const { externalToolsPage } = setup();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(logoService.buildLogoUrl).toHaveBeenCalledWith(externalToolsPage.data[1]);
			});

			it('should call filterForAvailableTools with ids of used tools', async () => {
				const { externalToolsPage } = setup();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(externalToolConfigurationService.filterForAvailableTools).toHaveBeenCalledWith(externalToolsPage, [
					'usedToolId',
				]);
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
				externalToolConfigurationService.filterForAvailableTools.mockReturnValue([externalTool]);

				return {
					externalTool,
				};
			};

			it('should call filterParametersForScope', async () => {
				const { externalTool } = setup();

				await uc.getAvailableToolsForSchool('userId', 'schoolId');

				expect(externalToolConfigurationService.filterParametersForScope).toHaveBeenCalledWith(
					externalTool,
					CustomParameterScope.SCHOOL
				);
			});
		});
	});

	describe('getAvailableToolsForContext', () => {
		describe('when the user has insufficient permission', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const tool: ContextExternalTool = contextExternalToolFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValue(new ForbiddenException());
				contextExternalToolService.findContextExternalTools.mockResolvedValue([tool]);

				return { user, tool };
			};

			it('should fail when authorizationService throws ForbiddenException', async () => {
				const { user, tool } = setup();

				const func = async () =>
					uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				await expect(func).rejects.toThrow(ForbiddenException);
				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					tool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});
		});

		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const user: User = userFactory.build();
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

				const externalTools: Page<ExternalTool> = new Page<ExternalTool>(
					[hiddenTool, usedTool, unusedTool, toolWithoutSchoolTool],
					4
				);
				const toolIds = ['usedToolId', 'unusedToolId', 'noSchoolTool'];
				const schoolExternalTools = [usedSchoolExternalTool, unusedSchoolExternalTool];

				externalToolService.findExternalTools.mockResolvedValue(
					new Page<ExternalTool>([hiddenTool, usedTool, unusedTool, toolWithoutSchoolTool], 4)
				);
				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([
					usedSchoolExternalTool,
					unusedSchoolExternalTool,
				]);
				contextExternalToolService.findContextExternalTools.mockResolvedValue([usedContextExternalTool]);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				externalToolConfigurationService.filterForAvailableExternalTools.mockReturnValue([
					{ externalTool: usedTool, schoolExternalTool: usedSchoolExternalTool },
				]);
				externalToolConfigurationService.filterForContextRestrictions.mockReturnValue([
					{ externalTool: usedTool, schoolExternalTool: usedSchoolExternalTool },
				]);

				return {
					user,
					toolIds,
					externalTools,
					schoolExternalTools,
					hiddenTool,
					usedTool,
					unusedTool,
					toolWithoutSchoolTool,
					usedSchoolExternalTool,
					unusedSchoolExternalTool,
					usedContextExternalTool,
				};
			};

			it('should call the toolPermissionHelper with CONTEXT_TOOL_ADMIN permission', async () => {
				const { user, usedContextExternalTool } = setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					usedContextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should call externalToolLogoService', async () => {
				const { usedTool } = setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(logoService.buildLogoUrl).toHaveBeenCalledWith(usedTool);
			});

			it('should filter for restricted contexts', async () => {
				const { usedTool, usedSchoolExternalTool } = setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(externalToolConfigurationService.filterForContextRestrictions).toHaveBeenCalledWith(
					[{ externalTool: usedTool, schoolExternalTool: usedSchoolExternalTool }],
					ToolContextType.COURSE
				);
			});

			it('should call filterParametersForScope', async () => {
				const { usedTool } = setup();

				await uc.getAvailableToolsForContext('userId', 'schoolId', 'contextId', ToolContextType.COURSE);

				expect(externalToolConfigurationService.filterParametersForScope).toHaveBeenCalledWith(
					usedTool,
					CustomParameterScope.CONTEXT
				);
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

				externalToolConfigurationService.filterForAvailableExternalTools.mockReturnValue([]);
				externalToolConfigurationService.filterForContextRestrictions.mockReturnValue([]);

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

				externalToolConfigurationService.filterForAvailableExternalTools.mockReturnValue([
					{ externalTool: usedTool, schoolExternalTool: usedSchoolExternalTool },
				]);
				externalToolConfigurationService.filterForContextRestrictions.mockReturnValue([
					{ externalTool: usedTool, schoolExternalTool: usedSchoolExternalTool },
				]);

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

	describe('getTemplateForSchoolExternalTool', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.buildWithId();
				const user: User = userFactory.build();
				const school: School = schoolFactory.build();

				const schoolExternalToolId: string = new ObjectId().toHexString();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId(
					{
						toolId: externalTool.id,
						schoolId: school.id,
					},
					schoolExternalToolId
				);

				schoolService.getSchoolById.mockResolvedValueOnce(school);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					user,
					externalTool,
					schoolExternalToolId,
					school,
				};
			};

			it('should successfully check the user permission with the authorization service', async () => {
				const { user, schoolExternalToolId, school } = setup();

				await uc.getTemplateForSchoolExternalTool('userId', schoolExternalToolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
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
				const schoolExternalTool = schoolExternalToolFactory.buildWithId(undefined, schoolExternalToolId);

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.checkPermission.mockImplementation(() => {
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
				const schoolExternalTool = schoolExternalToolFactory.buildWithId(
					{
						toolId: externalTool.id,
						schoolId: 'schoolId',
					},
					schoolExternalToolId
				);

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

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

	describe('getTemplateForContextExternalTool', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const user: User = userFactory.build();
				const externalTool: ExternalTool = externalToolFactory.buildWithId();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
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

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					user,
					externalTool,
					contextExternalTool,
					contextExternalToolId,
				};
			};

			it('should successfully check the user permission with the toolPermissionHelper', async () => {
				const { user, contextExternalToolId, contextExternalTool } = setup();

				await uc.getTemplateForContextExternalTool(user.id, contextExternalToolId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
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

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
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

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
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

				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

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

	describe('getToolContextTypes', () => {
		describe('when it is called', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: User = userFactory.build();
				user.id = userId;
				const contextTypes: ToolContextType[] = Object.values(ToolContextType);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockReturnValueOnce();
				externalToolConfigurationService.getToolContextTypes.mockReturnValueOnce(contextTypes);

				return { userId, user, contextTypes };
			};

			it('should get User', async () => {
				const { userId } = setup();

				await uc.getToolContextTypes(userId);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(userId);
			});

			it('should check Permission', async () => {
				const { userId, user } = setup();

				await uc.getToolContextTypes(userId);

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, ['TOOL_ADMIN']);
			});

			it('should get context types', async () => {
				const { userId } = setup();

				await uc.getToolContextTypes(userId);

				expect(externalToolConfigurationService.getToolContextTypes).toHaveBeenCalled();
			});

			it('should return all context types', async () => {
				const { userId } = setup();

				const result = await uc.getToolContextTypes(userId);

				expect(result).toEqual([ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT, ToolContextType.MEDIA_BOARD]);
			});
		});

		describe('when user does not have enough Permission', () => {
			const setup = () => {
				const userId: string = new ObjectId().toHexString();
				const user: User = userFactory.build();
				user.id = userId;
				const contextTypes: ToolContextType[] = Object.values(ToolContextType);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkAllPermissions.mockImplementation(() => {
					throw new UnauthorizedException();
				});
				externalToolConfigurationService.getToolContextTypes.mockReturnValueOnce(contextTypes);

				return { userId };
			};

			it('should throw unauthorized', async () => {
				const { userId } = setup();

				await expect(uc.getToolContextTypes(userId)).rejects.toThrow(new UnauthorizedException());
			});
		});
	});
});
