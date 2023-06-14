import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReference, BoardExternalReferenceType, EntityId } from '@shared/domain';
import { BoardRepo, LessonRepo } from '@shared/repo';
import { boardFactory, courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CardService, ColumnBoardService, ColumnService, ContentElementService } from '@src/modules/board';
import { TaskService } from '@src/modules/task/service';
import { ColumnBoardTargetService } from './column-board-target.service';
import { RoomsService } from './rooms.service';

describe('rooms service', () => {
	let module: TestingModule;
	let roomsService: RoomsService;
	let lessonRepo: DeepMocked<LessonRepo>;
	let taskService: DeepMocked<TaskService>;
	let boardRepo: DeepMocked<BoardRepo>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let columnBoardTargetService: DeepMocked<ColumnBoardTargetService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsService,
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: BoardRepo,
					useValue: createMock<BoardRepo>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: ColumnService,
					useValue: createMock<ColumnService>(),
				},
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: ColumnBoardTargetService,
					useValue: createMock<ColumnBoardTargetService>(),
				},
			],
		}).compile();
		roomsService = module.get(RoomsService);
		lessonRepo = module.get(LessonRepo);
		taskService = module.get(TaskService);
		boardRepo = module.get(BoardRepo);
		columnBoardService = module.get(ColumnBoardService);
		columnBoardTargetService = module.get(ColumnBoardTargetService);
	});

	beforeEach(() => {
		Configuration.set('FEATURE_COLUMN_BOARD_ENABLED', 'true');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('updateBoard', () => {
		describe('for lessons and tasks', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const room = courseFactory.buildWithId({ students: [user] });
				const tasks = taskFactory.buildList(3, { course: room });
				const lessons = lessonFactory.buildList(3, { course: room });
				const board = boardFactory.buildWithId({ course: room });

				board.syncBoardElementReferences([...tasks, ...lessons]);

				const tasksSpy = taskService.findBySingleParent.mockResolvedValue([tasks, 3]);
				const lessonsSpy = lessonRepo.findAllByCourseIds.mockResolvedValue([lessons, 3]);
				const syncBoardElementReferencesSpy = jest.spyOn(board, 'syncBoardElementReferences');
				const saveSpy = boardRepo.save.mockResolvedValue();

				return {
					user,
					board,
					room,
					tasks,
					lessons,
					lessonsSpy,
					tasksSpy,
					syncBoardElementReferencesSpy,
					saveSpy,
				};
			};

			it('should fetch all lessons of room', async () => {
				const { board, room, user, lessonsSpy } = setup();
				await roomsService.updateBoard(board, room.id, user.id);
				expect(lessonsSpy).toHaveBeenCalledWith([room.id]);
			});

			it('should fetch all tasks of room', async () => {
				const { board, room, user, tasksSpy } = setup();
				await roomsService.updateBoard(board, room.id, user.id);
				expect(tasksSpy).toHaveBeenCalledWith(user.id, room.id);
			});

			it('should sync boards lessons with fetched tasks and lessons', async () => {
				const { board, room, user, tasks, lessons, syncBoardElementReferencesSpy } = setup();
				await roomsService.updateBoard(board, room.id, user.id);
				expect(syncBoardElementReferencesSpy).toHaveBeenCalledWith([...lessons, ...tasks]);
			});

			it('should persist board', async () => {
				const { board, room, user, saveSpy } = setup();
				await roomsService.updateBoard(board, room.id, user.id);
				expect(saveSpy).toHaveBeenCalledWith(board);
			});
		});

		describe('for column boards', () => {
			const setup = () => {
				lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
				taskService.findBySingleParent.mockResolvedValueOnce([[], 0]);

				const user = userFactory.buildWithId();
				const course1 = courseFactory.buildWithId({ students: [user] });
				const course2 = courseFactory.buildWithId({ students: [user] });
				const boardWithoutColumnBoard = boardFactory.build({ course: course1 });
				const boardWithColumnBoard = boardFactory.build({ course: course2 });
				const columnBoardId = new ObjectId().toHexString();

				jest.spyOn(boardWithoutColumnBoard, 'syncBoardElementReferences').mockImplementation();
				jest.spyOn(boardWithColumnBoard, 'syncBoardElementReferences').mockImplementation();

				columnBoardService.findIdsByExternalReference.mockImplementation(
					async (courseReference: BoardExternalReference): Promise<EntityId[]> => {
						if (courseReference.id === boardWithColumnBoard.course.id) {
							return Promise.resolve([columnBoardId]);
						}
						return Promise.resolve([]);
					}
				);

				return { user, boardWithoutColumnBoard, boardWithColumnBoard, columnBoardId };
			};

			describe('when ColumnBoard-feature is enabled', () => {
				describe('when no column board exists for the board', () => {
					it('should create one', async () => {
						const { user, boardWithoutColumnBoard: board } = setup();

						await roomsService.updateBoard(board, board.course.id, user.id);

						expect(columnBoardService.create).toBeCalledWith<BoardExternalReference[]>({
							type: BoardExternalReferenceType.Course,
							id: board.course.id,
						});
					});
				});

				describe('when a colum board exists for the board', () => {
					it('should not create one', async () => {
						const { user, boardWithColumnBoard: board } = setup();

						await roomsService.updateBoard(board, board.course.id, user.id);

						expect(columnBoardService.create).not.toBeCalledWith(expect.objectContaining({ id: board.course.id }));
					});
				});

				it('should use the service to find or create targets', async () => {
					const { user, boardWithColumnBoard: board, columnBoardId } = setup();

					await roomsService.updateBoard(board, board.course.id, user.id);

					expect(columnBoardTargetService.findOrCreateTargets).toBeCalledWith([columnBoardId]);
				});
			});

			describe('when ColumnBoard-feature is disabled', () => {
				describe('when no column board exists for the board', () => {
					it('should NOT create one', async () => {
						const { user, boardWithoutColumnBoard: board } = setup();
						Configuration.set('FEATURE_COLUMN_BOARD_ENABLED', 'false');

						await roomsService.updateBoard(board, board.course.id, user.id);

						expect(columnBoardService.create).not.toBeCalled();
					});
				});

				it('should NOT use the service to find or create targets', async () => {
					const { user, boardWithColumnBoard: board } = setup();
					Configuration.set('FEATURE_COLUMN_BOARD_ENABLED', 'false');

					await roomsService.updateBoard(board, board.course.id, user.id);

					expect(columnBoardTargetService.findOrCreateTargets).not.toBeCalled();
				});
			});
		});
	});
});
