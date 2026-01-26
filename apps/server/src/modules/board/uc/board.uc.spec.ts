import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../copy-helper';
import { BoardNodeRule } from '../authorisation/board-node.rule';
import { BoardExternalReferenceType, BoardLayout, BoardNodeFactory, BoardRoles, Column, ColumnBoard } from '../domain';
import {
	BoardNodeAuthorizableService,
	BoardNodePermissionService,
	BoardNodeService,
	ColumnBoardService,
} from '../service';
import { boardNodeAuthorizableFactory, columnBoardFactory, columnFactory } from '../testing';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let courseService: DeepMocked<CourseService>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;
	let boardContextApiHelperService: DeepMocked<BoardContextApiHelperService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
				{
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
				{
					provide: RoomMembershipService,
					useValue: createMock<RoomMembershipService>(),
				},
				{
					provide: BoardContextApiHelperService,
					useValue: createMock<BoardContextApiHelperService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		authorizationService = module.get(AuthorizationService);
		boardNodeService = module.get(BoardNodeService);
		columnBoardService = module.get(ColumnBoardService);
		courseService = module.get(CourseService);
		boardNodeFactory = module.get(BoardNodeFactory);
		boardContextApiHelperService = module.get(BoardContextApiHelperService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		boardNodeRule = module.get(BoardNodeRule);
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const globalSetup = () => {
		jest.clearAllMocks();
		const user = userFactory.buildWithId();
		const board = columnBoardFactory.build();
		const boardId = board.id;
		const column = columnFactory.build();

		return { user, board, boardId, column }; // createCardBodyParams
	};

	const setupAuthorizable = (
		user: User,
		board: ColumnBoard,
		roles = [BoardRoles.EDITOR],
		canRoomEditorManageVideoconference?: boolean
	) => {
		const boardAuthorizable = boardNodeAuthorizableFactory.build({
			boardNode: board,
			users: [
				{
					roles,
					userId: user.id,
				},
			],
			boardContextSettings: { canRoomEditorManageVideoconference },
		});
		boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(boardAuthorizable);

		return boardAuthorizable;
	};

	describe('createBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.build();

			return { user, course };
		};
		describe('when creating a board', () => {
			it('should call the service to find the user', async () => {
				const { user } = setup();

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: new ObjectId().toHexString(),
					parentType: BoardExternalReferenceType.Course,
				});

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call the service to find the course', async () => {
				const { user } = setup();

				const courseId = new ObjectId().toHexString();

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: courseId,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(courseService.findById).toHaveBeenCalledWith(courseId);
			});

			it('should call the authorization service to check the permissions', async () => {
				const { user, course } = setup();

				courseService.findById.mockResolvedValueOnce(course);

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, course, {
					action: Action.write,
					requiredPermissions: [Permission.COURSE_EDIT],
				});
			});

			it('should call factory to build board', async () => {
				const { user, course } = setup();

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(boardNodeFactory.buildColumnBoard).toHaveBeenCalledWith({
					context: { type: BoardExternalReferenceType.Course, id: course.id },
					layout: BoardLayout.COLUMNS,
					title: 'new board',
				});
			});

			it('should call the service to create the board', async () => {
				const { user } = setup();

				const board = columnBoardFactory.build();
				boardNodeFactory.buildColumnBoard.mockReturnValueOnce(board);

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: new ObjectId().toHexString(),
					parentType: BoardExternalReferenceType.Course,
				});

				expect(boardNodeService.addRoot).toHaveBeenCalledWith(board);
			});

			it('should return the column board object', async () => {
				const { user } = setup();

				const board = columnBoardFactory.build();
				boardNodeFactory.buildColumnBoard.mockReturnValueOnce(board);

				const result = await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: new ObjectId().toHexString(),
					parentType: BoardExternalReferenceType.Course,
				});

				expect(result).toEqual(board);
			});
			describe('when context type is not supported', () => {
				it('should throw an error', async () => {
					const { user } = setup();

					await expect(
						uc.createBoard(user.id, {
							title: 'new board',
							layout: BoardLayout.COLUMNS,
							parentId: new ObjectId().toHexString(),
							parentType: BoardExternalReferenceType.User,
						})
					).rejects.toThrowError('Unsupported context type user');
				});
			});
		});
	});

	describe('findBoard', () => {
		it('should call the Board Node Service to find board ', async () => {
			const { user, board } = globalSetup();
			setupAuthorizable(user, board);

			await uc.findBoard(user.id, board.id);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
		});

		it('should call authorization service to check permission', async () => {
			const { user, board } = globalSetup();
			const boardAuthorizable = setupAuthorizable(user, board);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.findBoard(user.id, board.id);

			expect(boardNodeRule.canFindBoard).toHaveBeenCalledWith(user, boardAuthorizable);
		});

		it('should call the board context api helper service to get features', async () => {
			const { user, board } = globalSetup();
			setupAuthorizable(user, board);

			await uc.findBoard(user.id, board.id);

			expect(boardContextApiHelperService.getFeaturesForBoardNode).toHaveBeenCalledWith(board.id);
		});

		it('should return the column board object + features', async () => {
			const { user, board } = globalSetup();
			setupAuthorizable(user, board);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			const result = await uc.findBoard(user.id, board.id);

			expect(result).toEqual({
				board,
				features: [],
				permissions: [Permission.BOARD_VIEW, Permission.BOARD_EDIT, Permission.BOARD_MANAGE],
			});
		});

		describe('when user is board-admin', () => {
			it('should return correct permissions array', async () => {
				const { user, board } = globalSetup();
				setupAuthorizable(user, board, [BoardRoles.ADMIN]);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				const result = await uc.findBoard(user.id, board.id);

				expect(result).toEqual({
					board,
					features: [],
					permissions: [
						Permission.BOARD_VIEW,
						Permission.BOARD_EDIT,
						Permission.BOARD_MANAGE_VIDEOCONFERENCE,
						Permission.BOARD_MANAGE_READERS_CAN_EDIT,
						Permission.BOARD_MANAGE,
						Permission.BOARD_SHARE_BOARD,
						Permission.BOARD_RELOCATE_CONTENT,
					],
				});
			});
		});

		describe('when user is board-editor', () => {
			describe('when canRoomEditorManageVideoconference is true', () => {
				it('should return correct permissions array', async () => {
					const { user, board } = globalSetup();
					setupAuthorizable(user, board, [BoardRoles.EDITOR], true);
					boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

					const result = await uc.findBoard(user.id, board.id);

					expect(result).toEqual({
						board,
						features: [],
						permissions: [
							Permission.BOARD_VIEW,
							Permission.BOARD_EDIT,
							Permission.BOARD_MANAGE,
							Permission.BOARD_MANAGE_VIDEOCONFERENCE,
						],
					});
				});
			});

			describe('when canRoomEditorManageVideoconference is false', () => {
				it('should return correct permissions array', async () => {
					const { user, board } = globalSetup();
					setupAuthorizable(user, board, [BoardRoles.EDITOR], false);
					boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

					const result = await uc.findBoard(user.id, board.id);

					expect(result).toEqual({
						board,
						features: [],
						permissions: [Permission.BOARD_VIEW, Permission.BOARD_EDIT, Permission.BOARD_MANAGE],
					});
				});
			});
		});

		describe('when user is board-reader', () => {
			it('should return an empty permissions array', async () => {
				const { user, board } = globalSetup();
				setupAuthorizable(user, board, [BoardRoles.READER]);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				const result = await uc.findBoard(user.id, board.id);

				expect(result).toEqual({ board, features: [], permissions: [Permission.BOARD_VIEW] });
			});
		});

		describe('when user does not have a board role', () => {
			it('should return an empty permissions array', async () => {
				const { user, board } = globalSetup();
				setupAuthorizable(user, board, ['not-teacher-or-student'] as unknown as BoardRoles[]);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				const result = await uc.findBoard(user.id, board.id);

				expect(result).toEqual({ board, features: [], permissions: [] });
			});
		});
	});

	describe('findBoardContext', () => {
		it('should call the Board Node Service to find board ', async () => {
			const { user, boardId } = globalSetup();

			await uc.findBoardContext(user.id, boardId);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('should call Board Permission Service to check permission', async () => {
			const { user, board } = globalSetup();
			const boardAuthorizable = setupAuthorizable(user, board);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.findBoardContext(user.id, board.id);

			expect(boardNodeRule.canFindBoard).toHaveBeenCalledWith(user, boardAuthorizable);
		});

		it('should return the context object', async () => {
			const { user, board } = globalSetup();
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			const result = await uc.findBoardContext(user.id, board.id);

			expect(result).toEqual(board.context);
		});
	});

	describe('deleteBoard', () => {
		describe('when deleting a board', () => {
			it('should call the Board Node Service to find board ', async () => {
				const { user, boardId } = globalSetup();

				await uc.deleteBoard(user.id, boardId);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
			});

			it('should call Board Permission Service to check permission', async () => {
				const { user, board } = globalSetup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.deleteBoard(user.id, board.id);

				expect(boardNodeRule.canDeleteBoard).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the service to delete the board', async () => {
				const { user, board } = globalSetup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.deleteBoard(user.id, board.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(board);
			});
		});
	});

	describe('updateBoardTitle', () => {
		describe('when updating a board title', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = globalSetup();

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = globalSetup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(boardNodeRule.canUpdateBoardTitle).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the service to update the board title', async () => {
				const { user, board } = globalSetup();
				const newTitle = 'new title';
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.updateBoardTitle(user.id, board.id, newTitle);

				expect(boardNodeService.updateTitle).toHaveBeenCalledWith(board, newTitle);
			});
		});
	});

	describe('createColumn', () => {
		describe('when creating a column', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = globalSetup();

				await uc.createColumn(user.id, board.id);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id, 1);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = globalSetup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.createColumn(user.id, board.id);

				expect(boardNodeRule.canCreateColumn).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the factory to build column', async () => {
				const { user, board } = globalSetup();

				await uc.createColumn(user.id, board.id);

				expect(boardNodeFactory.buildColumn).toHaveBeenCalled();
			});

			it('should call the board node service to add the column to board', async () => {
				const { user, board, column } = globalSetup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);
				boardNodeFactory.buildColumn.mockReturnValueOnce(column);

				await uc.createColumn(user.id, board.id);

				expect(boardNodeService.addToParent).toHaveBeenCalledWith(board, column);
			});

			it('should return the column board object', async () => {
				const { user, board, column } = globalSetup();
				boardNodeFactory.buildColumn.mockReturnValueOnce(column);

				const result = await uc.createColumn(user.id, board.id);

				expect(result).toEqual(column);
			});
		});
	});

	describe('moveColumn', () => {
		describe('when moving a column', () => {
			it('should call the service to find the column', async () => {
				const { user, board, column } = globalSetup();

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(Column, column.id);
			});

			it('should call the service to find the target board', async () => {
				const { user, board, column } = globalSetup();

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
			});

			it('should call the service to check the permissions for column', async () => {
				const { user, board, column } = globalSetup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board).mockResolvedValueOnce(column);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardNodeRule.canMoveColumn).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the service to check the permissions for target board', async () => {
				const { user, board, column } = globalSetup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board).mockResolvedValueOnce(column);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardNodeRule.canCreateColumn).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the service to move the column', async () => {
				const { user, board, column } = globalSetup();
				// TODO think about using jest-when + @types/jest-when
				// https://github.com/timkindberg/jest-when
				// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jest-when
				boardNodeService.findByClassAndId.mockResolvedValueOnce(column);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(boardNodeService.move).toHaveBeenCalledWith(column, board, 7);
			});
		});
	});

	describe('copyBoard', () => {
		const setup = () => {
			const { user, board, boardId } = globalSetup();
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);
			const copyStatus: CopyStatus = {
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			columnBoardService.swapLinkedIdsInBoards.mockResolvedValueOnce(copyStatus);
			columnBoardService.copyColumnBoard.mockResolvedValueOnce(copyStatus);
			return { user, board, boardId, copyStatus };
		};

		it('should call the service to find the user', async () => {
			const { user, boardId } = setup();

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
		});

		it('should call the service to find the board', async () => {
			const { user, boardId } = setup();

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('[deprecated] should call course repo to find the course', async () => {
			const { user, boardId } = setup();

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(courseService.findById).toHaveBeenCalled();
		});

		it('should call Board Permission Service to check permission', async () => {
			const { user, board } = setup();
			const boardAuthorizable = setupAuthorizable(user, board);

			await uc.copyBoard(user.id, board.id, user.school.id);

			expect(boardNodeRule.canCopyBoard).toHaveBeenCalledWith(user, boardAuthorizable);
		});

		it('should call authorization to check course permissions', async () => {
			const { user, board, boardId } = setup();
			const boardAuthorizable = setupAuthorizable(user, board);
			const course = courseEntityFactory.build();
			// TODO should not use course repo
			courseService.findById.mockResolvedValueOnce(course);

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(boardNodeRule.canCopyBoard).toHaveBeenCalledWith(user, boardAuthorizable);
		});

		it('should call the service to copy the board', async () => {
			const { user, boardId } = setup();

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(columnBoardService.copyColumnBoard).toHaveBeenCalledWith(
				expect.objectContaining({ userId: user.id, originalColumnBoardId: boardId })
			);
		});

		it('should call columnBoardService to swapLinkedIdsInBoards', async () => {
			const { user, boardId } = setup();

			await uc.copyBoard(user.id, boardId, user.school.id);

			expect(columnBoardService.swapLinkedIdsInBoards).toHaveBeenCalled();
		});

		it('should return the copy status', async () => {
			const { user, boardId, copyStatus } = setup();

			const result = await uc.copyBoard(user.id, boardId, user.school.id);

			expect(result).toEqual(copyStatus);
		});
	});

	describe('updateVisibility', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();

			return { user, board };
		};

		it('should call the service to find the board', async () => {
			const { user, board } = setup();

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
		});

		it('should call the service to check the permissions', async () => {
			const { user, board } = setup();
			const boardAuthorizable = setupAuthorizable(user, board);
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardNodeRule.canUpdateBoardVisibility).toHaveBeenCalledWith(user, boardAuthorizable);
		});

		it('should call the service to update the board visibility', async () => {
			const { user, board } = setup();

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardNodeService.updateVisibility).toHaveBeenCalledWith(board.id, true);
		});
	});

	describe('updateLayout', () => {
		describe('when updating the layout', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const board = columnBoardFactory.build();

				return { user, board };
			};

			it('should call the service to find the board', async () => {
				const { user, board } = setup();

				await uc.updateLayout(user.id, board.id, BoardLayout.LIST);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, board.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = setup();
				const boardAuthorizable = setupAuthorizable(user, board);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.updateLayout(user.id, board.id, BoardLayout.LIST);

				expect(boardNodeRule.canUpdateBoardLayout).toHaveBeenCalledWith(user, boardAuthorizable);
			});

			it('should call the service to update the board layout', async () => {
				const { user, board } = setup();

				await uc.updateLayout(user.id, board.id, BoardLayout.LIST);

				expect(boardNodeService.updateLayout).toHaveBeenCalledWith(board.id, BoardLayout.LIST);
			});
		});
	});
});
