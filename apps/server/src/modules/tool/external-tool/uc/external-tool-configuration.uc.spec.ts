import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalToolDO,
	CustomParameterScope,
	ExternalToolDO,
	Page,
	Permission,
	SchoolExternalToolDO,
	User,
} from '@shared/domain';
import { contextExternalToolDOFactory, setupEntities, userFactory } from '@shared/testing';
import { externalToolDOFactory, schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/tool';
import { ICurrentUser } from '@src/modules/authentication';
import { Action, AuthorizableReferenceType, AuthorizationService } from '../../../authorization';
import { ExternalToolConfigurationUc } from './external-tool-configuration.uc';
import { ToolContextType } from '../../common/interface';
import { ExternalToolService } from '../service';
import { SchoolExternalToolService } from '../../school-external-tool/service/school-external-tool.service';
import { ContextExternalToolService } from '../../context-external-tool/service';

describe('ExternalToolConfigurationUc', () => {
	let module: TestingModule;
	let uc: ExternalToolConfigurationUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

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
			],
		}).compile();

		uc = module.get(ExternalToolConfigurationUc);
		externalToolService = module.get(ExternalToolService);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getExternalToolForSchool is called', () => {
		const setupAuthorization = () => {
			const user: User = userFactory.buildWithId();
			const currentUser: ICurrentUser = { userId: user.id, schoolId: user.school.id } as ICurrentUser;

			return {
				user,
				currentUser,
			};
		};
		const setupForSchool = () => {
			const externalToolId: string = new ObjectId().toHexString();
			const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);

			externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

			return {
				externalToolDO,
				externalToolId,
			};
		};

		describe('when the user has permission to read an external tool', () => {
			it('should successfully check the user permission with the authorization service', async () => {
				const { currentUser, user } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.School,
					'schoolId',
					{
						action: Action.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});

			it('should call the externalToolService', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				await uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				expect(externalToolService.getExternalToolForScope).toHaveBeenCalledWith(
					externalToolId,
					CustomParameterScope.SCHOOL
				);
			});
		});

		describe('when the user has insufficient permission to read an external tool', () => {
			it('should throw UnauthorizedException ', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId } = setupForSchool();

				authorizationService.checkPermissionByReferences.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.getExternalToolForSchool(
					currentUser.userId,
					externalToolId,
					'schoolId'
				);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when tool is hidden', () => {
			it(' should throw NotFoundException', async () => {
				const { currentUser } = setupAuthorization();
				const { externalToolId, externalToolDO } = setupForSchool();
				externalToolDO.isHidden = true;

				const result = uc.getExternalToolForSchool(currentUser.userId, externalToolId, 'schoolId');

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});
	});

	describe('getExternalToolForContext is called', () => {
		describe('when the user has permission to read an external tool', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id, schoolId: user.school.id } as ICurrentUser;
				const externalToolId: string = new ObjectId().toHexString();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId: string = new ObjectId().toHexString();

				externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

				return {
					user,
					currentUser,
					externalToolId,
					contextType,
					contextId,
				};
			};

			it('should successfully find the user with the permission', async () => {
				const { currentUser, user, externalToolId, contextId, contextType } = setup();

				await uc.getExternalToolForContext(currentUser.userId, externalToolId, contextId, contextType);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AuthorizableReferenceType.Course,
					contextId,
					{
						action: Action.read,
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					}
				);
			});

			it('should call the externalToolService', async () => {
				const { currentUser, externalToolId, contextId, contextType } = setup();

				await uc.getExternalToolForContext(currentUser.userId, externalToolId, contextId, contextType);

				expect(externalToolService.getExternalToolForScope).toHaveBeenCalledWith(
					externalToolId,
					CustomParameterScope.CONTEXT
				);
			});
		});

		describe('when the user has insufficient permission to read an external tool', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id, schoolId: user.school.id } as ICurrentUser;
				const externalToolId: string = new ObjectId().toHexString();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId: string = new ObjectId().toHexString();

				externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

				return {
					currentUser,
					externalToolId,
					contextType,
					contextId,
				};
			};

			it('should throw UnauthorizedException ', async () => {
				const { currentUser, externalToolId, contextId, contextType } = setup();

				authorizationService.checkPermissionByReferences.mockImplementation(() => {
					throw new UnauthorizedException();
				});

				const result: Promise<ExternalToolDO> = uc.getExternalToolForContext(
					currentUser.userId,
					externalToolId,
					contextId,
					contextType
				);

				await expect(result).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when tool is hidden', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser: ICurrentUser = { userId: user.id, schoolId: user.school.id } as ICurrentUser;
				const externalToolId: string = new ObjectId().toHexString();
				const externalToolDO: ExternalToolDO = externalToolDOFactory.buildWithId(undefined, externalToolId);
				const contextType: ToolContextType = ToolContextType.COURSE;
				const contextId: string = new ObjectId().toHexString();

				externalToolService.getExternalToolForScope.mockResolvedValue(externalToolDO);

				return {
					currentUser,
					externalToolDO,
					externalToolId,
					contextType,
					contextId,
				};
			};

			it(' should throw NotFoundException', async () => {
				const { currentUser, externalToolId, externalToolDO, contextId, contextType } = setup();
				externalToolDO.isHidden = true;

				const result = uc.getExternalToolForContext(currentUser.userId, externalToolId, contextId, contextType);

				await expect(result).rejects.toThrow(new NotFoundException('Could not find the Tool Template'));
			});
		});
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
	});
});
