import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
	ForbiddenLoggableException,
} from '@modules/authorization';
import { BoardDoAuthorizableService, ContentElementService } from '@modules/board';
import { CourseService } from '@modules/learnroom';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { BoardDoAuthorizable, ExternalToolElement } from '@shared/domain/domainobject';
import { Permission } from '@shared/domain/interface';
import {
	boardDoAuthorizableFactory,
	contextExternalToolFactory,
	courseFactory,
	externalToolElementFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { ContextExternalTool, ContextRef } from '../../context-external-tool/domain';
import { ToolContextType } from '../enum';
import { ToolPermissionHelper } from './tool-permission-helper';

describe('ToolPermissionHelper', () => {
	let module: TestingModule;
	let helper: ToolPermissionHelper;

	let authorizationService: DeepMocked<AuthorizationService>;
	let courseService: DeepMocked<CourseService>;
	let contentElementService: DeepMocked<ContentElementService>;
	let boardDoAuthorizableService: DeepMocked<BoardDoAuthorizableService>;

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
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: BoardDoAuthorizableService,
					useValue: createMock<BoardDoAuthorizableService>(),
				},
			],
		}).compile();

		helper = module.get(ToolPermissionHelper);
		authorizationService = module.get(AuthorizationService);
		courseService = module.get(CourseService);
		contentElementService = module.get(ContentElementService);
		boardDoAuthorizableService = module.get(BoardDoAuthorizableService);
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
				const externalToolElement: ExternalToolElement = externalToolElementFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: externalToolElement.id,
						type: ToolContextType.BOARD_ELEMENT,
					}),
				});
				const board: BoardDoAuthorizable = boardDoAuthorizableFactory.build();
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				contentElementService.findById.mockResolvedValueOnce(externalToolElement);
				boardDoAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(board);

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
				const board: BoardDoAuthorizable = boardDoAuthorizableFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					contextRef: new ContextRef({
						id: board.id,
						type: ToolContextType.MEDIA_BOARD,
					}),
				});
				const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardDoAuthorizableService.findById.mockResolvedValueOnce(board);

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
});
