import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { contextExternalToolFactory, schoolExternalToolFactory, setupEntities, userFactory } from '@shared/testing';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalToolWithId } from '../../school-external-tool/domain';
import { ContextExternalTool, ContextExternalToolWithId } from '../domain';
import { ContextExternalToolService } from '../service';
import { ContextExternalToolValidationService } from '../service/context-external-tool-validation.service';
import { ContextExternalToolUc } from './context-external-tool.uc';

describe('ContextExternalToolUc', () => {
	let module: TestingModule;
	let uc: ContextExternalToolUc;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolUc,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ContextExternalToolValidationService,
					useValue: createMock<ContextExternalToolValidationService>(),
				},
				{
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createContextExternalTool', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				}) as ContextExternalToolWithId;

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					user,
					schoolId,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, user, schoolId } = setup();

				await uc.createContextExternalTool(user.id, schoolId, contextExternalTool);

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, user, schoolId } = setup();

				await uc.createContextExternalTool(user.id, schoolId, contextExternalTool);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should check for context restrictions', async () => {
				const { contextExternalTool, user, schoolId } = setup();

				await uc.createContextExternalTool(user.id, schoolId, contextExternalTool);

				expect(contextExternalToolService.checkContextRestrictions).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { contextExternalTool, user, schoolId } = setup();

				await uc.createContextExternalTool(user.id, schoolId, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should return the saved object', async () => {
				const { contextExternalTool, user, schoolId } = setup();

				const result = await uc.createContextExternalTool(user.id, schoolId, contextExternalTool);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when tool is restricted to a different context', () => {
			const setup = () => {
				const userId: EntityId = new ObjectId().toHexString();
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				}) as ContextExternalToolWithId;

				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const error: Error = new Error();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
				contextExternalToolService.checkContextRestrictions.mockRejectedValueOnce(error);

				return {
					contextExternalTool,
					userId,
					schoolId,
					context,
					error,
				};
			};

			it('should throw an error and not save the contextExternalTool', async () => {
				const { contextExternalTool, userId, error, schoolId } = setup();

				await expect(uc.createContextExternalTool(userId, schoolId, contextExternalTool)).rejects.toThrow(error);

				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the user is from a different school than the school external tool', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId } = setup();

				const func = () => uc.createContextExternalTool(userId, new ObjectId().toHexString(), contextExternalTool);

				await expect(func).rejects.toThrow(
					new ForbiddenLoggableException(
						userId,
						AuthorizableReferenceType.ContextExternalToolEntity,
						AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
					)
				);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the user does not have permission', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				const error = new ForbiddenException();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValue(error);

				return {
					contextExternalTool,
					userId,
					schoolId,
					error,
				};
			};

			it('should return forbidden and not save', async () => {
				const { contextExternalTool, userId, error, schoolId } = setup();

				const func = () => uc.createContextExternalTool(userId, schoolId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the validation fails', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				const error = new UnprocessableEntityException();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolValidationService.validate.mockRejectedValue(error);

				return {
					contextExternalTool,
					userId,
					schoolId,
					error,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId, error, schoolId } = setup();

				const func = () => uc.createContextExternalTool(userId, schoolId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});
	});

	describe('updateContextExternalTool', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				}) as ContextExternalToolWithId;

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id,
					user,
					schoolId,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool);

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool);

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should return the saved object', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				const result = await uc.updateContextExternalTool(
					user.id,
					schoolId,
					contextExternalToolId,
					contextExternalTool
				);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when the user is from a different school than the school external tool', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
					userId,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId, contextExternalToolId } = setup();

				const func = () =>
					uc.updateContextExternalTool(
						userId,
						new ObjectId().toHexString(),
						contextExternalToolId,
						contextExternalTool
					);

				await expect(func).rejects.toThrow(
					new ForbiddenLoggableException(
						userId,
						AuthorizableReferenceType.ContextExternalToolEntity,
						AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
					)
				);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the user does not have permission', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				const error = new ForbiddenException();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValue(error);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
					userId,
					schoolId,
					error,
				};
			};

			it('should return forbidden and not save', async () => {
				const { contextExternalTool, userId, error, schoolId, contextExternalToolId } = setup();

				const func = () => uc.updateContextExternalTool(userId, schoolId, contextExternalToolId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the validation fails', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				}) as SchoolExternalToolWithId;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				const error = new UnprocessableEntityException();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				contextExternalToolValidationService.validate.mockRejectedValue(error);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
					userId,
					schoolId,
					error,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId, error, schoolId, contextExternalToolId } = setup();

				const func = () => uc.updateContextExternalTool(userId, schoolId, contextExternalToolId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});
	});

	describe('deleteContextExternalTool', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

				toolPermissionHelper.ensureContextPermissions.mockResolvedValue();
				contextExternalToolService.findByIdOrFail.mockResolvedValue(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id as string,
					user,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, contextExternalToolId, user } = setup();

				await uc.deleteContextExternalTool(user.id, contextExternalToolId);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, contextExternalToolId, user } = setup();

				await uc.deleteContextExternalTool(user.id, contextExternalToolId);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});
		});
	});

	describe('getContextExternalToolsForContext', () => {
		describe('when parameters are given and user has permission ', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const user: User = userFactory.build();
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.findAllByContext.mockResolvedValue([contextExternalTool]);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.hasPermission.mockReturnValue(true);

				return {
					contextExternalTool,
					userId,
					user,
					contextId,
					contextType,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { userId, contextType, contextId } = setup();

				await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(contextExternalToolService.findAllByContext).toHaveBeenCalledWith({
					id: contextId,
					type: contextType,
				});
			});

			it('should call Authorization Service to ensure permissions', async () => {
				const { userId, user, contextType, contextId, contextExternalTool } = setup();

				await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(authorizationService.hasPermission).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});
		});

		describe('when permission is not granted', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.findAllByContext.mockResolvedValue([contextExternalTool]);
				authorizationService.hasPermission.mockReturnValue(false);

				return {
					userId,
					contextId,
					contextType,
				};
			};

			it('should not include the tool in the response', async () => {
				const { userId, contextType, contextId } = setup();

				const tools = await uc.getContextExternalToolsForContext(userId, contextType, contextId);

				expect(tools).toEqual([]);
			});
		});

		describe('when some other error is thrown', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				contextExternalToolService.findAllByContext.mockRejectedValue(new Error());

				return {
					userId,
					contextId,
					contextType,
				};
			};

			it('should rethrow any exception other than ForbiddenLoggableException', async () => {
				const { userId, contextType, contextId } = setup();

				const func = () => uc.getContextExternalToolsForContext(userId, contextType, contextId);

				await expect(func()).rejects.toThrow(Error);
			});
		});
	});

	describe('getContextExternalTool', () => {
		describe('when right permission, context  and id is given', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.findByIdOrFail.mockResolvedValue(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockResolvedValue(Promise.resolve());
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					user,
					contextId,
					contextType,
				};
			};

			it('should call contextExternalToolService to ensure permission  ', async () => {
				const { contextExternalTool, user } = setup();

				await uc.getContextExternalTool(user.id, contextExternalTool.id as string);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should call contextExternalToolService to get contextExternalTool  ', async () => {
				const { contextExternalTool, user } = setup();

				await uc.getContextExternalTool(user.id, contextExternalTool.id as string);

				expect(contextExternalToolService.findByIdOrFail).toHaveBeenCalledWith(contextExternalTool.id);
			});
		});

		describe('when currentUser has no permission', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const contextId: EntityId = 'contextId';
				const contextType: ToolContextType = ToolContextType.COURSE;

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					contextRef: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});

				contextExternalToolService.findByIdOrFail.mockResolvedValue(contextExternalTool);
				toolPermissionHelper.ensureContextPermissions.mockRejectedValue(
					new ForbiddenLoggableException(
						userId,
						'contextExternalTool',
						AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
					)
				);

				return {
					contextExternalTool,
					userId,
					contextId,
					contextType,
				};
			};

			it('should throw forbiddenLoggableException', async () => {
				const { contextExternalTool, userId } = setup();

				const func = () => uc.getContextExternalTool(userId, contextExternalTool.id as string);

				await expect(func).rejects.toThrow(
					new ForbiddenLoggableException(userId, 'contextExternalTool', {
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
						action: Action.read,
					})
				);
			});
		});
	});
});
