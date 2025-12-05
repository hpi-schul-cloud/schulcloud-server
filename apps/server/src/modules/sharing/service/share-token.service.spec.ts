import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeService, ColumnBoardService } from '@modules/board';
import { cardFactory, columnBoardFactory } from '@modules/board/testing';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { TaskService } from '@modules/task';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { RoomService } from '@modules/room';
import { roomFactory } from '@modules/room/testing';
import { User } from '@modules/user/repo';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ShareTokenContextType, ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenRepo } from '../repo/share-token.repo';
import { shareTokenDOFactory } from '../testing/share-token.do.factory';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

const buildId = () => new ObjectId().toHexString();

describe('ShareTokenService', () => {
	let module: TestingModule;
	let service: ShareTokenService;
	let generator: DeepMocked<TokenGenerator>;
	let repo: DeepMocked<ShareTokenRepo>;
	let courseService: DeepMocked<CourseService>;
	let lessonService: DeepMocked<LessonService>;
	let taskService: DeepMocked<TaskService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let roomService: DeepMocked<RoomService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ShareTokenService,
				{
					provide: TokenGenerator,
					useValue: createMock<TokenGenerator>(),
				},
				{
					provide: ShareTokenRepo,
					useValue: createMock<ShareTokenRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
				{
					provide: TaskService,
					useValue: createMock<TaskService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: RoomService,
					useValue: createMock<RoomService>(),
				},
			],
		}).compile();

		service = await module.get(ShareTokenService);
		generator = await module.get(TokenGenerator);
		repo = await module.get(ShareTokenRepo);
		courseService = await module.get(CourseService);
		lessonService = await module.get(LessonService);
		taskService = await module.get(TaskService);
		columnBoardService = await module.get(ColumnBoardService);
		boardNodeService = await module.get(BoardNodeService);
		roomService = await module.get(RoomService);
		await setupEntities([User, CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createToken', () => {
		it('should create a token', () => {
			const courseId = buildId();

			const token = service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(token).toBeDefined();
		});

		it('should use the token generator', async () => {
			const courseId = buildId();

			const token = 'share-token';
			generator.generateShareToken.mockReturnValue(token);

			await service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(generator.generateShareToken).toBeCalled();
			expect(token).toEqual(token);
		});

		it('should use the repo to persist the shareToken', async () => {
			const courseId = buildId();

			await service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(repo.save).toBeCalled();
		});

		it('should add context to shareToken', async () => {
			const schoolId = buildId();
			const courseId = buildId();
			const context = {
				contextType: ShareTokenContextType.School,
				contextId: schoolId,
			};

			await service.createToken(
				{
					parentId: courseId,
					parentType: ShareTokenParentType.Course,
				},
				{
					context,
				}
			);

			expect(repo.save).toBeCalledWith(expect.objectContaining({ context }));
		});
	});

	describe('lookup', () => {
		it('should lookup a shareToken using a token', async () => {
			const shareToken = shareTokenDOFactory.build();
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupToken(shareToken.token);

			expect(result).toEqual(shareToken);
		});

		it('should throw an error when token is invalid', async () => {
			repo.findOneByToken.mockRejectedValue(new NotFoundException());

			const lookupToken = async () => service.lookupToken('invalid-token');

			await expect(lookupToken).rejects.toThrowError(NotFoundException);
		});

		it('should throw an error when shareToken is expired', async () => {
			const shareToken = shareTokenDOFactory.build({ expiresAt: new Date(Date.now() - 10000) });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const lookupToken = async () => service.lookupToken(shareToken.token);

			await expect(lookupToken).rejects.toThrowError();
		});
	});

	describe('lookup with parent name', () => {
		it('when parent is course', async () => {
			const course = courseEntityFactory.buildWithId();
			courseService.findById.mockResolvedValue(course);

			const payload = { parentId: course.id, parentType: ShareTokenParentType.Course };
			const shareToken = shareTokenDOFactory.build({ payload });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupTokenWithParentName(shareToken.token);

			expect(result).toEqual({ shareToken, parentName: course.name });
		});

		it('when parent is lesson', async () => {
			const lesson = lessonFactory.buildWithId();
			lessonService.findById.mockResolvedValue(lesson);

			const payload = { parentId: lesson.id, parentType: ShareTokenParentType.Lesson };
			const shareToken = shareTokenDOFactory.build({ payload });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupTokenWithParentName(shareToken.token);

			expect(result).toEqual({ shareToken, parentName: lesson.name });
		});

		it('when parent is task', async () => {
			const task = taskFactory.buildWithId();
			taskService.findById.mockResolvedValue(task);

			const payload = { parentId: task.id, parentType: ShareTokenParentType.Task };
			const shareToken = shareTokenDOFactory.build({ payload });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupTokenWithParentName(shareToken.token);

			expect(result).toEqual({ shareToken, parentName: task.name });
		});

		describe('when parent is column board', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build();
				columnBoardService.findById.mockResolvedValue(columnBoard);

				const payload = { parentId: columnBoard.id, parentType: ShareTokenParentType.ColumnBoard };
				const shareToken = shareTokenDOFactory.build({ payload });
				repo.findOneByToken.mockResolvedValue(shareToken);

				return { columnBoard, shareToken };
			};
			it('should return shareToken and parent name', async () => {
				const { columnBoard, shareToken } = setup();

				const result = await service.lookupTokenWithParentName(shareToken.token);
				expect(result).toEqual({ shareToken, parentName: columnBoard.title });
			});
		});

		describe('when parent is room', () => {
			const setup = () => {
				const room = roomFactory.build();
				roomService.getSingleRoom.mockResolvedValue(room);

				const payload = { parentId: room.id, parentType: ShareTokenParentType.Room };
				const shareToken = shareTokenDOFactory.build({ payload });
				repo.findOneByToken.mockResolvedValue(shareToken);

				return { room, shareToken };
			};
			it('should return shareToken and parent name', async () => {
				const { room, shareToken } = setup();

				const result = await service.lookupTokenWithParentName(shareToken.token);
				expect(result).toEqual({ shareToken, parentName: room.name });
			});
		});

		describe('when parent is card', () => {
			const setup = () => {
				const card = cardFactory.build();
				boardNodeService.findByClassAndId.mockResolvedValue(card);

				const payload = { parentId: card.id, parentType: ShareTokenParentType.Card };
				const shareToken = shareTokenDOFactory.build({ payload });
				repo.findOneByToken.mockResolvedValue(shareToken);

				return { card, shareToken };
			};
			it('should return shareToken and parent name', async () => {
				const { card, shareToken } = setup();

				const result = await service.lookupTokenWithParentName(shareToken.token);
				expect(result).toEqual({ shareToken, parentName: card.title });
			});
		});

		it('should throw if parent type is not supported', async () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const shareToken = shareTokenDOFactory.build({ payload: { parentType: 'invalid' } });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const lookupToken = async () => service.lookupTokenWithParentName(shareToken.token);

			await expect(lookupToken).rejects.toThrowError('Invalid parent type');
		});
	});
});
