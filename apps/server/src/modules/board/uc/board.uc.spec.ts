import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Action, AuthorizationService } from '@modules/authorization';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { courseFactory } from '@shared/testing/factory';
import { Permission } from '@shared/domain/interface';
import { ColumnBoardService, ColumnService, ContentElementService } from '../service';
import { ColumnBoardCopyService } from '../service/column-board-copy.service';
import { BoardUc } from './board.uc';
import { BoardNodePermissionService } from '../poc/service/board-node-permission.service';
import { BoardLayout } from '../poc/domain';

describe(BoardUc.name, () => {
	let module: TestingModule;
	let uc: BoardUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let boardPernmissionService: DeepMocked<BoardNodePermissionService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let columnBoardCopyService: DeepMocked<ColumnBoardCopyService>;
	let columnService: DeepMocked<ColumnService>;
	let courseRepo: DeepMocked<CourseRepo>;

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
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: ColumnBoardCopyService,
					useValue: createMock<ColumnBoardCopyService>(),
				},
				{
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
			],
		}).compile();

		uc = module.get(BoardUc);
		authorizationService = module.get(AuthorizationService);
		boardPernmissionService = module.get(BoardNodePermissionService);
		columnBoardService = module.get(ColumnBoardService);
		columnBoardCopyService = module.get(ColumnBoardCopyService);
		columnService = module.get(ColumnService);
		courseRepo = module.get(CourseRepo);
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

			it('should call the service to create the board', async () => {
				const { user, course } = setup();

				await uc.createBoard(user.id, {
					title: 'new board',
					layout: BoardLayout.COLUMNS,
					parentId: course.id,
					parentType: BoardExternalReferenceType.Course,
				});

				expect(columnBoardService.create).toHaveBeenCalledWith(
					{ type: BoardExternalReferenceType.Course, id: course.id },
					BoardLayout.COLUMNS,
					'new board'
				);
			});

			it('should return the column board object', async () => {
				const { user, board } = globalSetup();
				columnBoardService.create.mockResolvedValueOnce(board);

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
		describe('when loading a board and having required permission', () => {
			it('should call the Column Board Service to find board ', async () => {
				const { user, boardId } = globalSetup();

				await uc.findBoard(user.id, boardId);

				expect(columnBoardService.findById).toHaveBeenCalledWith(boardId);
			});

			it('should call Board Permission Service to check permission', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.findBoard(user.id, board.id);

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.read);
			});

			it('should return the column board object', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				const result = await uc.findBoard(user.id, board.id);

				expect(result).toEqual(board);
			});
		});

		describe('when loading a board without having permissions', () => {
			it('should throw Forbidden Exception', async () => {
				const { board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				boardPernmissionService.checkPermission.mockImplementationOnce(() => {
					throw new ForbiddenException();
				});

				const fakeUserId = new ObjectId().toHexString();

				await expect(uc.findBoard(fakeUserId, board.id)).rejects.toThrow(ForbiddenException);
			});
		});
	});

	describe('getBoardContext', () => {
		it('should call the Column Board Service to find board ', async () => {
			const { user, boardId } = globalSetup();

			await uc.findBoardContext(user.id, boardId);

			expect(columnBoardService.findById).toHaveBeenCalledWith(boardId);
		});

		it('should call Board Permission Service to check permission', async () => {
			const { user, board } = globalSetup();
			columnBoardService.findById.mockResolvedValueOnce(board);

			await uc.findBoardContext(user.id, board.id);

			expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.read);
		});

		it('should return the context object', async () => {
			const { user, board } = globalSetup();

			columnBoardService.findById.mockResolvedValueOnce(board);

			const result = await uc.findBoardContext(user.id, board.id);

			expect(result).toEqual(board.context);
		});
	});

	describe('deleteBoard', () => {
		describe('when deleting a board', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = globalSetup();

				await uc.deleteBoard(user.id, board.id);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.deleteBoard(user.id, board.id);

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
			});

			it('should call the service to delete the board', async () => {
				const { user, board } = globalSetup();

				await uc.deleteBoard(user.id, board.id);

				expect(columnBoardService.delete).toHaveBeenCalledWith(board);
			});
		});
	});

	describe('updateBoardTitle', () => {
		describe('when updating a board title', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = globalSetup();

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.updateBoardTitle(user.id, board.id, 'new title');

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
			});

			it('should call the service to update the board title', async () => {
				const { user, board } = globalSetup();
				const newTitle = 'new title';

				await uc.updateBoardTitle(user.id, board.id, newTitle);

				expect(columnBoardService.updateTitle).toHaveBeenCalledWith(board, newTitle);
			});
		});
	});

	describe('createColumn', () => {
		describe('when creating a column', () => {
			it('should call the service to find the board', async () => {
				const { user, board } = globalSetup();

				await uc.createColumn(user.id, board.id);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to check the permissions', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.createColumn(user.id, board.id);

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
			});

			it('should call the service to create the column', async () => {
				const { user, board } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.createColumn(user.id, board.id);

				expect(columnService.create).toHaveBeenCalledWith(board);
			});

			it('should return the column board object', async () => {
				const { user, board, column } = globalSetup();
				columnService.create.mockResolvedValueOnce(column);

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

				expect(columnService.findById).toHaveBeenCalledWith(column.id);
			});

			it('should call the service to find the target board', async () => {
				const { user, board, column } = globalSetup();

				await uc.moveColumn(user.id, column.id, board.id, 7);

				expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
			});

			it('should call the service to check the permissions for column', async () => {
				const { user, board, column } = globalSetup();
				columnService.findById.mockResolvedValueOnce(column);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, column, Action.write);
			});

			it('should call the service to check the permissions for target board', async () => {
				const { user, board, column } = globalSetup();
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.moveColumn(user.id, column.id, board.id, 1);

				expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
			});

			it('should call the service to move the column', async () => {
				const { user, board, column } = globalSetup();
				columnService.findById.mockResolvedValueOnce(column);
				columnBoardService.findById.mockResolvedValueOnce(board);

				await uc.moveColumn(user.id, board.id, column.id, 7);

				expect(columnService.move).toHaveBeenCalledWith(column, board, 7);
			});
		});
	});

	describe('copyBoard', () => {
		it('should call the service to copy the board', async () => {
			const { user, boardId } = globalSetup();

			await uc.copyBoard(user.id, boardId);

			expect(columnBoardCopyService.copyColumnBoard).toHaveBeenCalledWith(
				expect.objectContaining({ userId: user.id, originalColumnBoardId: boardId })
			);
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

			expect(columnBoardService.findById).toHaveBeenCalledWith(board.id);
		});

		it('should call the service to check the permissions', async () => {
			const { user, board } = setup();

			columnBoardService.findById.mockResolvedValueOnce(board);

			await uc.updateVisibility(user.id, board.id, true);

			expect(boardPernmissionService.checkPermission).toHaveBeenCalledWith(user.id, board, Action.write);
		});

		it('should call the service to update the board visibility', async () => {
			const { user, board } = setup();

			await uc.updateVisibility(user.id, board.id, true);

			expect(columnBoardService.updateBoardVisibility).toHaveBeenCalledWith(board.id, true);
		});
	});
});
