import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { BoardNodeAuthorizableService, BoardNodeAuthorizable, BoardNodeService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Permission } from '@shared/domain/interface';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';

import { boardNodeAuthorizableFactory, externalToolElementFactory } from '@modules/board/testing';
import { ContextExternalTool, ContextRef } from '../../context-external-tool/domain';
import { contextExternalToolFactory } from '../../context-external-tool/testing';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import { ToolContextType } from '../enum';
import { ToolPermissionHelper } from './tool-permission-helper';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				ToolPermissionHelper,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('ensureContextPermissions', () => {
		describe('when a context external tool for context "course" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: course.id,
						type: ToolContextType.COURSE,
					}),
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(course);

				return {
					user,
					course,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, course, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(user, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, contextExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, course, context);
			});
		});

		describe('when a context external tool for context "board element" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalToolElement = externalToolElementFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: externalToolElement.id,
						type: ToolContextType.BOARD_ELEMENT,
					}),
				});
				const board: BoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(board);

				return {
					user,
					board,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, board, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(user, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, contextExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, board, context);
			});
		});

		describe('when a context external tool for context "media board" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const board: BoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: board.id,
						type: ToolContextType.MEDIA_BOARD,
					}),
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.findById.mockResolvedValueOnce(board);

				return {
					user,
					board,
					contextExternalTool,
					context,
				};
			};

			it('should check permission for context external tool', async () => {
				const { user, board, contextExternalTool, context } = setup();

				await helper.ensureContextPermissions(user, contextExternalTool, context);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, contextExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, board, context);
			});
		});

		describe('when the context external tool has an unknown context', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: {
						type: 'unknown type' as unknown as ToolContextType,
					},
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					contextExternalTool,
					context,
				};
			};

			it('should throw a forbidden loggable exception', async () => {
				const { user, contextExternalTool, context } = setup();

				await expect(helper.ensureContextPermissions(user, contextExternalTool, context)).rejects.toThrowError(
					new ForbiddenLoggableException(user.id, AuthorizableReferenceType.ContextExternalToolEntity, context)
				);
			});
		});

		describe('when user is unauthorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
				const error = new ForbiddenException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw error;
				});

				return {
					user,
					contextExternalTool,
					context,
					error,
				};
			};

			it('should check permission for context external tool and fail', async () => {
				const { user, contextExternalTool, context, error } = setup();

				await expect(helper.ensureContextPermissions(user, contextExternalTool, context)).rejects.toThrowError(error);
			});
		});
	});

	describe('ensureContextPermissionsForSchool', () => {
		describe('when a school external tool for context "course" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextRef = new ContextRef({
					id: course.id,
					type: ToolContextType.COURSE,
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				courseService.findById.mockResolvedValueOnce(course);

				return {
					user,
					course,
					schoolExternalTool,
					contextRef,
					context,
				};
			};

			it('should check permission for school external tool', async () => {
				const { user, course, schoolExternalTool, context, contextRef } = setup();

				await helper.ensureContextPermissionsForSchool(
					user,
					schoolExternalTool,
					contextRef.id,
					contextRef.type,
					context
				);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, schoolExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, course, context);
			});
		});

		describe('when a school external tool for context "board element" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const externalToolElement = externalToolElementFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextRef = new ContextRef({
					id: externalToolElement.id,
					type: ToolContextType.BOARD_ELEMENT,
				});
				const board: BoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeService.findById.mockResolvedValueOnce(externalToolElement);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(board);

				return {
					user,
					board,
					schoolExternalTool,
					contextRef,
					context,
				};
			};

			it('should check permission for school external tool', async () => {
				const { user, board, schoolExternalTool, contextRef, context } = setup();

				await helper.ensureContextPermissionsForSchool(
					user,
					schoolExternalTool,
					contextRef.id,
					contextRef.type,
					context
				);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, schoolExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, board, context);
			});
		});

		describe('when a school external tool for context "media board" is given', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const board: BoardNodeAuthorizable = boardNodeAuthorizableFactory.build();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextRef = new ContextRef({
					id: board.id,
					type: ToolContextType.MEDIA_BOARD,
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.findById.mockResolvedValueOnce(board);

				return {
					user,
					board,
					schoolExternalTool,
					contextRef,
					context,
				};
			};

			it('should check permission for school external tool', async () => {
				const { user, board, schoolExternalTool, contextRef, context } = setup();

				await helper.ensureContextPermissionsForSchool(
					user,
					schoolExternalTool,
					contextRef.id,
					contextRef.type,
					context
				);

				expect(authorizationService.checkPermission).toHaveBeenCalledTimes(2);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(1, user, schoolExternalTool, context);
				expect(authorizationService.checkPermission).toHaveBeenNthCalledWith(2, user, board, context);
			});
		});

		describe('when the school external tool has an unknown context', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextRef = new ContextRef({
					id: new ObjectId().toHexString(),
					type: 'unknown type' as unknown as ToolContextType,
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					schoolExternalTool,
					contextRef,
					context,
				};
			};

			it('should throw a forbidden loggable exception', async () => {
				const { user, schoolExternalTool, contextRef, context } = setup();

				await expect(
					helper.ensureContextPermissionsForSchool(user, schoolExternalTool, contextRef.id, contextRef.type, context)
				).rejects.toThrowError(
					new ForbiddenLoggableException(user.id, AuthorizableReferenceType.ContextExternalToolEntity, context)
				);
			});
		});

		describe('when user is unauthorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const schoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextRef = new ContextRef({
					id: new ObjectId().toHexString(),
					type: ToolContextType.COURSE,
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);
				const error = new ForbiddenException();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw error;
				});

				return {
					user,
					schoolExternalTool,
					contextRef,
					context,
					error,
				};
			};

			it('should check permission for school external tool and fail', async () => {
				const { user, schoolExternalTool, contextRef, context, error } = setup();

				await expect(
					helper.ensureContextPermissionsForSchool(user, schoolExternalTool, contextRef.id, contextRef.type, context)
				).rejects.toThrowError(error);
			});
		});
	});
});
