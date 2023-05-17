import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, BoardRoles } from '@shared/domain';
import { courseFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory } from '@shared/testing/factory/domainobject';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { BoardDoRepo } from '../repo';
import { BoardDoAuthorizableService } from './board-do-authorizable.service';

describe(BoardDoAuthorizableService.name, () => {
	let module: TestingModule;
	let service: BoardDoAuthorizableService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let courseService: DeepMocked<CourseService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoAuthorizableService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		service = module.get(BoardDoAuthorizableService);
		boardDoRepo = module.get(BoardDoRepo);
		courseService = module.get(CourseService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when finding a board domainobject', () => {
			const setup = () => {
				const columnBoard = columnBoardFactory.build();
				boardDoRepo.findById.mockResolvedValue(columnBoard);

				return { columnBoardId: columnBoard.id };
			};

			it('should call the repository', async () => {
				const { columnBoardId } = setup();

				await service.findById(columnBoardId);

				expect(boardDoRepo.findById).toHaveBeenCalledWith(columnBoardId, 1);
			});

			it('should return the column', async () => {
				const { columnBoardId } = setup();

				const result = await service.findById(columnBoardId);

				expect(result).toEqual({ users: [], id: columnBoardId });
			});
		});
	});

	describe('getBoardAuthorizable', () => {
		describe('when having an empty board', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				return { board };
			};

			it('should return an empty usergroup', async () => {
				const { board } = setup();
				boardDoRepo.findById.mockResolvedValueOnce(board);

				const userGroup = await service.getBoardAuthorizable(board);

				expect(userGroup).toEqual({ users: [], id: board.id });
			});
		});

		describe('when having a board with a teacher and some students', () => {
			const setup = () => {
				const roles = roleFactory.buildList(1, {});
				const teacher = userFactory.buildWithId({ roles });
				const students = userFactory.buildListWithId(3);
				const course = courseFactory.buildWithId({ teachers: [teacher], students });
				const board = columnBoardFactory.build({ context: { type: BoardExternalReferenceType.Course, id: course.id } });
				boardDoRepo.findById.mockResolvedValueOnce(board);
				courseService.findById.mockResolvedValueOnce(course);
				return { board, teacherId: teacher.id, studentIds: students.map((s) => s.id) };
			};

			it('should return the teacher and the students with correct roles', async () => {
				const { board, teacherId, studentIds } = setup();

				const userGroup = await service.getBoardAuthorizable(board);
				const userPermissions = userGroup.users.reduce((map, user) => {
					map[user.userId] = user.roles;
					return map;
				}, {});

				expect(userGroup.users).toHaveLength(4);
				expect(userPermissions[teacherId]).toEqual([BoardRoles.EDITOR]);
				expect(userPermissions[studentIds[0]]).toEqual([BoardRoles.READER]);
				expect(userPermissions[studentIds[1]]).toEqual([BoardRoles.READER]);
				expect(userPermissions[studentIds[2]]).toEqual([BoardRoles.READER]);
			});
		});
	});
});
