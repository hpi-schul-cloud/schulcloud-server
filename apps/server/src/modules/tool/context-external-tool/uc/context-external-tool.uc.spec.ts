import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	Action,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { BoardContextApiHelperService } from '@modules/board-context';
import { schoolEntityFactory } from '@modules/school/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { UUID } from 'bson';
import { LtiMessageType, ToolContextType } from '../../common/enum';
import { Lti11EncryptionService } from '../../common/service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ExternalToolService } from '../../external-tool';
import { externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import {
	ContextExternalTool,
	ContextExternalToolProps,
	InvalidOauthSignatureLoggableException,
	InvalidToolTypeLoggableException,
	LtiDeepLinkTokenMissingLoggableException,
} from '../domain';
import { ContextExternalToolService, LtiDeepLinkingService, LtiDeepLinkTokenService } from '../service';
import { ContextExternalToolValidationService } from '../service/context-external-tool-validation.service';
import {
	contextExternalToolFactory,
	Lti11DeepLinkParamsFactory,
	ltiDeepLinkFactory,
	ltiDeepLinkTokenFactory,
} from '../testing';
import { ContextExternalToolUc } from './context-external-tool.uc';

describe(ContextExternalToolUc.name, () => {
	let module: TestingModule;
	let uc: ContextExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let contextExternalToolValidationService: DeepMocked<ContextExternalToolValidationService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let ltiDeepLinkTokenService: DeepMocked<LtiDeepLinkTokenService>;
	let ltiDeepLinkingService: DeepMocked<LtiDeepLinkingService>;
	let lti11EncryptionService: DeepMocked<Lti11EncryptionService>;
	let encryptionService: DeepMocked<EncryptionService>;
	let boardContextApiHelperService: DeepMocked<BoardContextApiHelperService>;

	beforeAll(async () => {
		await setupEntities([User]);
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolUc,
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
				{
					provide: LtiDeepLinkTokenService,
					useValue: createMock<LtiDeepLinkTokenService>(),
				},
				{
					provide: LtiDeepLinkingService,
					useValue: createMock<LtiDeepLinkingService>(),
				},
				{
					provide: Lti11EncryptionService,
					useValue: createMock<Lti11EncryptionService>(),
				},
				{
					provide: BoardContextApiHelperService,
					useValue: createMock<BoardContextApiHelperService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		uc = module.get(ContextExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		contextExternalToolValidationService = module.get(ContextExternalToolValidationService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		ltiDeepLinkTokenService = module.get(LtiDeepLinkTokenService);
		ltiDeepLinkingService = module.get(LtiDeepLinkingService);
		lti11EncryptionService = module.get(Lti11EncryptionService);
		boardContextApiHelperService = module.get(BoardContextApiHelperService);
		encryptionService = module.get(DefaultEncryptionService);
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
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const schoolId: EntityId = school.id;

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

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
				});

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
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, user, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should check for context restrictions', async () => {
				const { contextExternalTool, user, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

				expect(contextExternalToolService.checkContextRestrictions).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { contextExternalTool, user, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should return the saved object', async () => {
				const { contextExternalTool, user, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				const result = await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when tool is restricted to a different context', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const schoolId: EntityId = school.id;
				const user = userFactory.buildWithId({ school });
				const userId = user.id;

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

				const contextExternalTool = contextExternalToolFactory.buildWithId({
					displayName: 'Course',
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId,
					},
					contextRef: {
						id: 'aCourseId',
						type: ToolContextType.COURSE,
					},
				});

				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const error: Error = new Error();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
				contextExternalToolService.checkContextRestrictions.mockRejectedValueOnce(error);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					userId,
					schoolId,
					context,
					error,
				};
			};

			it('should throw an error and not save the contextExternalTool', async () => {
				const { contextExternalTool, userId, error } = setup();

				await expect(uc.createContextExternalTool(userId, contextExternalTool)).rejects.toThrow(error);

				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the user is from a different school than the school external tool', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const userId = user.id;
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

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
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					userId,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId } = setup();

				const func = () => uc.createContextExternalTool(userId, contextExternalTool);

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
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const userId = user.id;
				const schoolId: EntityId = school.id;

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

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
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					userId,
					schoolId,
					error,
				};
			};

			it('should return forbidden and not save', async () => {
				const { contextExternalTool, userId, error, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				const func = () => uc.createContextExternalTool(userId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when the validation fails', () => {
			const setup = () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.buildWithId({ school });
				const userId = user.id;
				const schoolId: EntityId = school.id;

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

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
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					userId,
					schoolId,
					error,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId, error, schoolId } = setup();
				boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

				const func = () => uc.createContextExternalTool(userId, contextExternalTool);

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when working on a columnBoard of a room', () => {
			describe('when the user is from a different school', () => {
				it('should use the boardContextApiHelperService to determine the right schoolId', async () => {
					const school = schoolEntityFactory.buildWithId();
					const user = userFactory.buildWithId({ school });
					const schoolId: EntityId = school.id;

					const schoolExternalTool = schoolExternalToolFactory.buildWithId({
						schoolId,
					});

					const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
						displayName: 'Course',
						schoolToolRef: {
							schoolToolId: schoolExternalTool.id,
							schoolId,
						},
						contextRef: {
							id: 'contextId',
							type: ToolContextType.BOARD_ELEMENT,
						},
					});

					schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
					authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
					boardContextApiHelperService.getSchoolIdForBoardNode.mockResolvedValueOnce(schoolId);

					await uc.createContextExternalTool(user.id, contextExternalTool.getProps());

					expect(boardContextApiHelperService.getSchoolIdForBoardNode).toHaveBeenCalledWith('contextId');
				});
			});
		});
	});

	describe('updateContextExternalTool', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

				const ltiDeepLink = ltiDeepLinkFactory.build();
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
					ltiDeepLink,
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				contextExternalToolService.saveContextExternalTool.mockResolvedValue(contextExternalTool);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id,
					user,
					schoolId,
					ltiDeepLink,
				};
			};

			it('should call contextExternalToolService', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId, ltiDeepLink } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool.getProps());

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(
					expect.objectContaining<ContextExternalToolProps>({
						...contextExternalTool.getProps(),
						id: expect.any(String),
						ltiDeepLink,
					})
				);
			});

			it('should call contextExternalToolService to ensure permissions', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool.getProps());

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					expect.objectContaining<ContextExternalToolProps>({
						...contextExternalTool.getProps(),
						id: expect.any(String),
					}),
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should call contextExternalToolValidationService', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				await uc.updateContextExternalTool(user.id, schoolId, contextExternalToolId, contextExternalTool.getProps());

				expect(contextExternalToolValidationService.validate).toHaveBeenCalledWith(
					expect.objectContaining<ContextExternalToolProps>({
						...contextExternalTool.getProps(),
						id: expect.any(String),
					})
				);
			});

			it('should return the saved object', async () => {
				const { contextExternalTool, user, schoolId, contextExternalToolId } = setup();

				const result = await uc.updateContextExternalTool(
					user.id,
					schoolId,
					contextExternalToolId,
					contextExternalTool.getProps()
				);

				expect(result).toEqual(
					expect.objectContaining<ContextExternalToolProps>({
						...contextExternalTool.getProps(),
						id: expect.any(String),
					})
				);
			});
		});

		describe('when the user is from a different school than the school external tool', () => {
			const setup = () => {
				const userId: EntityId = 'userId';
				const schoolId: EntityId = new ObjectId().toHexString();

				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId,
				});

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
					contextExternalToolId: contextExternalTool.id,
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
				});

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
					contextExternalToolId: contextExternalTool.id,
					userId,
					schoolId,
					error,
				};
			};

			it('should return forbidden and not save', async () => {
				const { contextExternalTool, userId, error, schoolId, contextExternalToolId } = setup();

				const func = () =>
					uc.updateContextExternalTool(userId, schoolId, contextExternalToolId, contextExternalTool.getProps());

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
				});

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
					contextExternalToolId: contextExternalTool.id,
					userId,
					schoolId,
					error,
				};
			};

			it('should return UnprocessableEntity and not save', async () => {
				const { contextExternalTool, userId, error, schoolId, contextExternalToolId } = setup();

				const func = () =>
					uc.updateContextExternalTool(userId, schoolId, contextExternalToolId, contextExternalTool.getProps());

				await expect(func).rejects.toThrow(error);
				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});
	});

	describe('deleteContextExternalTool', () => {
		describe('when contextExternalTool is given and user has permission ', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

				toolPermissionHelper.ensureContextPermissions.mockResolvedValue();
				contextExternalToolService.findByIdOrFail.mockResolvedValue(contextExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					contextExternalTool,
					contextExternalToolId: contextExternalTool.id,
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
				const user = userFactory.build();
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
				const user = userFactory.buildWithId();
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

				await uc.getContextExternalTool(user.id, contextExternalTool.id);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should call contextExternalToolService to get contextExternalTool  ', async () => {
				const { contextExternalTool, user } = setup();

				await uc.getContextExternalTool(user.id, contextExternalTool.id);

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

				const func = () => uc.getContextExternalTool(userId, contextExternalTool.id);

				await expect(func).rejects.toThrow(
					new ForbiddenLoggableException(userId, 'contextExternalTool', {
						requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
						action: Action.read,
					})
				);
			});
		});
	});

	describe('updateLtiDeepLink', () => {
		describe('when deep linking a content', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const key = 'key';
				const secret = 'secret';
				const state = new UUID().toString();
				const payload = new Lti11DeepLinkParamsFactory().buildRaw({
					data: state,
				});
				const ltiDeepLink = ltiDeepLinkFactory.build();
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build({ userId: user.id, state });
				const externalTool = externalToolFactory
					.withLti11Config({
						key,
						secret,
						lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST,
					})
					.build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: { schoolToolId: schoolExternalTool.id, schoolId: user.school.id },
					displayName: 'oldName',
				});
				const linkedContextExternalTool = new ContextExternalTool({
					...contextExternalTool.getProps(),
					ltiDeepLink,
					displayName: ltiDeepLink.title,
				});
				const callbackUrl = 'https://this.cloud/lti-deep-link-callback';

				ltiDeepLinkTokenService.findByState.mockResolvedValueOnce(ltiDeepLinkToken);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				ltiDeepLinkingService.getCallbackUrl.mockReturnValueOnce(callbackUrl);
				encryptionService.decrypt.mockReturnValueOnce('decryptedSecret');
				lti11EncryptionService.verify.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				contextExternalToolService.saveContextExternalTool.mockResolvedValueOnce(linkedContextExternalTool);

				return {
					contextExternalTool,
					ltiDeepLink,
					payload,
					user,
					key,
					secret,
					state,
					callbackUrl,
					linkedContextExternalTool,
				};
			};

			it('should check the oauth signature', async () => {
				const { contextExternalTool, payload, ltiDeepLink, key, state, callbackUrl } = setup();

				await uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink);

				expect(lti11EncryptionService.verify).toHaveBeenCalledWith(key, 'decryptedSecret', callbackUrl, payload);
			});

			it('should check the user permission', async () => {
				const { contextExternalTool, payload, ltiDeepLink, state, user } = setup();

				await uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink);

				expect(toolPermissionHelper.ensureContextPermissions).toHaveBeenCalledWith(
					user,
					contextExternalTool,
					AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
				);
			});

			it('should should save the linked tool', async () => {
				const { contextExternalTool, payload, ltiDeepLink, state, linkedContextExternalTool } = setup();

				await uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink);

				expect(contextExternalToolService.saveContextExternalTool).toHaveBeenCalledWith(linkedContextExternalTool);
			});
		});

		describe('when no content was linked', () => {
			const setup = () => {
				const state = new UUID().toString();
				const payload = new Lti11DeepLinkParamsFactory().buildRaw({ data: state });
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build({ state });
				const contextExternalTool = contextExternalToolFactory.build();

				ltiDeepLinkTokenService.findByState.mockResolvedValueOnce(ltiDeepLinkToken);

				return {
					contextExternalTool,
					payload,
					state,
				};
			};

			it('should do nothing', async () => {
				const { contextExternalTool, payload, state } = setup();

				await uc.updateLtiDeepLink(contextExternalTool.id, payload, state);

				expect(contextExternalToolService.saveContextExternalTool).not.toHaveBeenCalled();
			});
		});

		describe('when deep linking a content', () => {
			const setup = () => {
				const state = new UUID().toString();
				const payload = new Lti11DeepLinkParamsFactory().buildRaw({
					data: state,
				});
				const ltiDeepLink = ltiDeepLinkFactory.build();
				const contextExternalTool = contextExternalToolFactory.build();

				ltiDeepLinkTokenService.findByState.mockResolvedValueOnce(null);

				return {
					contextExternalTool,
					payload,
					ltiDeepLink,
					state,
				};
			};

			it('should throw an error', async () => {
				const { contextExternalTool, payload, ltiDeepLink, state } = setup();

				await expect(uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink)).rejects.toThrow(
					LtiDeepLinkTokenMissingLoggableException
				);
			});
		});

		describe('when the external tool is not an lti 1.1 tool', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const state = new UUID().toString();
				const payload = new Lti11DeepLinkParamsFactory().buildRaw({
					data: state,
				});
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build({ userId: user.id, state });
				const ltiDeepLink = ltiDeepLinkFactory.build();
				const externalTool = externalToolFactory.withBasicConfig().build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: { schoolToolId: schoolExternalTool.id, schoolId: user.school.id },
				});

				ltiDeepLinkTokenService.findByState.mockResolvedValueOnce(ltiDeepLinkToken);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);

				return {
					contextExternalTool,
					ltiDeepLink,
					payload,
					state,
				};
			};

			it('should throw an error', async () => {
				const { contextExternalTool, payload, ltiDeepLink, state } = setup();

				await expect(uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink)).rejects.toThrow(
					InvalidToolTypeLoggableException
				);
			});
		});

		describe('when the oauth signature is invalid', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const state = new UUID().toString();
				const payload = new Lti11DeepLinkParamsFactory().buildRaw({
					data: state,
				});
				const ltiDeepLinkToken = ltiDeepLinkTokenFactory.build({ userId: user.id, state });
				const ltiDeepLink = ltiDeepLinkFactory.build();
				const externalTool = externalToolFactory
					.withLti11Config({ lti_message_type: LtiMessageType.CONTENT_ITEM_SELECTION_REQUEST })
					.build();
				const schoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool.id });
				const contextExternalTool = contextExternalToolFactory.build({
					schoolToolRef: { schoolToolId: schoolExternalTool.id, schoolId: user.school.id },
				});
				const callbackUrl = 'https://this.cloud/lti-deep-link-callback';

				ltiDeepLinkTokenService.findByState.mockResolvedValueOnce(ltiDeepLinkToken);
				contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(contextExternalTool);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				ltiDeepLinkingService.getCallbackUrl.mockReturnValueOnce(callbackUrl);
				encryptionService.decrypt.mockReturnValueOnce('decryptedSecret');
				lti11EncryptionService.verify.mockReturnValueOnce(false);

				return {
					contextExternalTool,
					ltiDeepLink,
					payload,
					state,
				};
			};

			it('should throw an error', async () => {
				const { contextExternalTool, payload, ltiDeepLink, state } = setup();

				await expect(uc.updateLtiDeepLink(contextExternalTool.id, payload, state, ltiDeepLink)).rejects.toThrow(
					InvalidOauthSignatureLoggableException
				);
			});
		});
	});
});
