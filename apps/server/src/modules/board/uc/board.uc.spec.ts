import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { CourseRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { courseFactory } from '@shared/testing/factory';
import { LegacyLogger } from '@src/core/logger';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../../copy-helper';
import { BoardExternalReferenceType, BoardLayout, BoardNodeFactory, Column, ColumnBoard } from '../domain';
import { BoardNodePermissionService, BoardNodeService, ColumnBoardService } from '../service';
import { columnBoardFactory, columnFactory } from '../testing';
import { BoardUc } from './board.uc';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardPermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let courseRepo: DeepMocked<CourseRepo>;
	let boardNodeFactory: DeepMocked<BoardNodeFactory>;

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
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: BoardNodeFactory,
					useValue: createMock<BoardNodeFactory>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		authorizationService = module.get(AuthorizationService);
		boardPermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		columnBoardService = module.get(ColumnBoardService);
		courseRepo = module.get(CourseRepo);
		boardNodeFactory = module.get(BoardNodeFactory);
		await setupEntities();
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

	describe('createBoard', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course = courseFactory.build();

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

				expect(courseRepo.findById).toHaveBeenCalledWith(courseId);
			});

			it('should call the authorization service to check the permissions', async () => {
				const { user, course } = setup();

				courseRepo.findById.mockResolvedValueOnce(course);

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
		});
	});

	describe('findBoard', () => {
		it('should call the Board Node Service to find board ', async () => {
			const { user, boardId } = globalSetup();

			await uc.findBoard(user.id, boardId);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('should call Board Permission Service to check permission', async () => {
			const { user, board } = globalSetup();
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.findBoard(user.id, board.id);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.read);
		});

		it('should return the column board object', async () => {
			const { user, board } = globalSetup();
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			const result = await uc.findBoard(user.id, board.id);

			expect(result).toEqual(board);
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
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.findBoardContext(user.id, board.id);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.read);
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
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.deleteBoard(user.id, board.id);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
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
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
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
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

				await uc.createColumn(user.id, board.id);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
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
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board).mockResolvedValueOnce(column);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the service to check the permissions for target board', async () => {
				const { user, board, column } = globalSetup();
				boardNodeService.findByClassAndId.mockResolvedValueOnce(board).mockResolvedValueOnce(column);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
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
		it('should call the service to find the user', async () => {
			const { user, boardId } = globalSetup();

			await uc.copyBoard(user.id, boardId);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
		});

		it('should call the service to find the board', async () => {
			const { user, boardId } = globalSetup();

			await uc.copyBoard(user.id, boardId);

			expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(ColumnBoard, boardId);
		});

		it('[deprecated] should call course repo to find the course', async () => {
			const { user, boardId } = globalSetup();

			await uc.copyBoard(user.id, boardId);

			expect(courseRepo.findById).toHaveBeenCalled();
		});

		it('should call Board Permission Service to check permission', async () => {
			const { user, board } = globalSetup();
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.copyBoard(user.id, board.id);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.read);
		});

		it('should call authorization to check course permissions', async () => {
			const { user, boardId } = globalSetup();

			const course = courseFactory.build();
			// TODO should not use course repo
			courseRepo.findById.mockResolvedValueOnce(course);

			await uc.copyBoard(user.id, boardId);

			expect(authorizationService.checkPermission).toHaveBeenCalledWith(user, course, {
				action: Action.write,
				requiredPermissions: [],
			});
		});

		it('should call the service to copy the board', async () => {
			const { user, boardId } = globalSetup();

			await uc.copyBoard(user.id, boardId);

			expect(columnBoardService.copyColumnBoard).toHaveBeenCalledWith(
				expect.objectContaining({ userId: user.id, originalColumnBoardId: boardId })
			);
		});

		it('should return the copy status', async () => {
			const { user, boardId } = globalSetup();

			const copyStatus: CopyStatus = {
				type: CopyElementType.BOARD,
				status: CopyStatusEnum.SUCCESS,
			};
			columnBoardService.copyColumnBoard.mockResolvedValueOnce(copyStatus);

			const result = await uc.copyBoard(user.id, boardId);

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
			boardNodeService.findByClassAndId.mockResolvedValueOnce(board);

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardPermissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
		});

		it('should call the service to update the board visibility', async () => {
			const { user, board } = setup();

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardNodeService.updateVisibility).toHaveBeenCalledWith(board.id, true);
		});
	});
});
