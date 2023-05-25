import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, BoardRoles } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { courseFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo } from '../repo';
import { BoardDoAuthorizableService } from './board-do-authorizable.service';

describe(BoardDoAuthorizableService.name, () => {
	let module: TestingModule;
	let service: BoardDoAuthorizableService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoAuthorizableService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(BoardDoAuthorizableService);
		boardDoRepo = module.get(BoardDoRepo);
		courseRepo = module.get(CourseRepo);
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

				expect(result.id).toEqual(columnBoardId);
			});
		});
	});

	describe('getBoardAuthorizable', () => {
		describe('when having a board with a teacher and some students', () => {
			const setup = () => {
				const roles = roleFactory.buildList(1, {});
				const teacher = userFactory.buildWithId({ roles });
				const substitutionTeacher = userFactory.buildWithId({ roles });
				const students = userFactory.buildListWithId(3);
				const course = courseFactory.buildWithId({
					teachers: [teacher],
					substitutionTeachers: [substitutionTeacher],
					students,
				});
				const board = columnBoardFactory.build({ context: { type: BoardExternalReferenceType.Course, id: course.id } });
				boardDoRepo.findById.mockResolvedValueOnce(board);
				courseRepo.findById.mockResolvedValueOnce(course);
				return {
					board,
					teacherId: teacher.id,
					substitutionTeacherId: substitutionTeacher.id,
					studentIds: students.map((s) => s.id),
				};
			};

			it('should return the teacher and the students with correct roles', async () => {
				const { board, teacherId, substitutionTeacherId, studentIds } = setup();

				const boardDoAuthorizable = await service.getBoardAuthorizable(board);
				const userPermissions = boardDoAuthorizable.users.reduce((map, user) => {
					map[user.userId] = user.roles;
					return map;
				}, {});

				expect(boardDoAuthorizable.users).toHaveLength(5);
				expect(userPermissions[teacherId]).toEqual([BoardRoles.EDITOR]);
				expect(userPermissions[substitutionTeacherId]).toEqual([BoardRoles.EDITOR]);
				expect(userPermissions[studentIds[0]]).toEqual([BoardRoles.READER]);
				expect(userPermissions[studentIds[1]]).toEqual([BoardRoles.READER]);
				expect(userPermissions[studentIds[2]]).toEqual([BoardRoles.READER]);
			});
		});

		describe('when trying to create a boardDoAuthorizable on a column', () => {
			const setup = () => {
				const roles = roleFactory.buildList(1, {});
				const teacher = userFactory.buildWithId({ roles });
				const students = userFactory.buildListWithId(3);
				const column = columnFactory.build();
				boardDoRepo.findById.mockResolvedValueOnce(column);
				return { column, teacherId: teacher.id, studentIds: students.map((s) => s.id) };
			};

			it('should throw an error', async () => {
				const { column } = setup();

				await expect(() => service.getBoardAuthorizable(column)).rejects.toThrowError();
			});
		});

		describe('when having a board that does not reference a course', () => {
			const setup = () => {
				const teacher = userFactory.buildWithId();
				const board = columnBoardFactory.withoutContext().build();
				boardDoRepo.findById.mockResolvedValueOnce(board);
				return { board, teacherId: teacher.id };
			};

			it('should return an boardDoAuthorizable without user-entries', async () => {
				const { board } = setup();

				const boardDoAuthorizable = await service.getBoardAuthorizable(board);
				expect(boardDoAuthorizable.users).toHaveLength(0);
			});
		});
	});
});
