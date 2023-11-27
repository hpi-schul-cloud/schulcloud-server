import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardExternalReferenceType, BoardRoles, UserRoleEnum } from '@shared/domain';
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
		describe('when having an empty board', () => {
			const setup = () => {
				const board = columnBoardFactory.build();
				return { board };
			};

			it('should return an empty usergroup', async () => {
				const { board } = setup();
				boardDoRepo.findById.mockResolvedValueOnce(board);

				const userGroup = await service.getBoardAuthorizable(board);

				expect(userGroup.id).toEqual(board.id);
				expect(userGroup.users.length).toEqual(0);
			});
		});

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
					teacher,
					substitutionTeacher,
					students,
				};
			};

			it('should return the teacher and the students with correct roles', async () => {
				const { board, teacherId, substitutionTeacherId, studentIds } = setup();

				const boardDoAuthorizable = await service.getBoardAuthorizable(board);
				const userPermissions = boardDoAuthorizable.users.reduce((map, user) => {
					map[user.userId] = user.roles;
					return map;
				}, {});

				const userRoleEnums = boardDoAuthorizable.users.reduce((map, user) => {
					map[user.userId] = user.userRoleEnum;
					return map;
				}, {});

				expect(boardDoAuthorizable.users).toHaveLength(5);
				expect(userPermissions[teacherId]).toEqual([BoardRoles.EDITOR]);
				expect(userRoleEnums[teacherId]).toEqual(UserRoleEnum.TEACHER);
				expect(userPermissions[substitutionTeacherId]).toEqual([BoardRoles.EDITOR]);
				expect(userRoleEnums[substitutionTeacherId]).toEqual(UserRoleEnum.SUBSTITUTION_TEACHER);
				expect(userPermissions[studentIds[0]]).toEqual([BoardRoles.READER]);
				expect(userRoleEnums[studentIds[0]]).toEqual(UserRoleEnum.STUDENT);
				expect(userPermissions[studentIds[1]]).toEqual([BoardRoles.READER]);
				expect(userRoleEnums[studentIds[1]]).toEqual(UserRoleEnum.STUDENT);
				expect(userPermissions[studentIds[2]]).toEqual([BoardRoles.READER]);
				expect(userRoleEnums[studentIds[2]]).toEqual(UserRoleEnum.STUDENT);
			});

			it('should return the users with their names', async () => {
				const { board, teacher, substitutionTeacher, students } = setup();

				const boardDoAuthorizable = await service.getBoardAuthorizable(board);
				const firstNames = boardDoAuthorizable.users.reduce((map, user) => {
					map[user.userId] = user.firstName;
					return map;
				}, {});

				const lastNames = boardDoAuthorizable.users.reduce((map, user) => {
					map[user.userId] = user.lastName;
					return map;
				}, {});

				expect(boardDoAuthorizable.users).toHaveLength(5);
				expect(firstNames[teacher.id]).toEqual(teacher.firstName);
				expect(lastNames[teacher.id]).toEqual(teacher.lastName);
				expect(firstNames[substitutionTeacher.id]).toEqual(substitutionTeacher.firstName);
				expect(lastNames[substitutionTeacher.id]).toEqual(substitutionTeacher.lastName);
				expect(firstNames[students[0].id]).toEqual(students[0].firstName);
				expect(lastNames[students[0].id]).toEqual(students[0].lastName);
				expect(firstNames[students[1].id]).toEqual(students[1].firstName);
				expect(lastNames[students[1].id]).toEqual(students[1].lastName);
				expect(firstNames[students[2].id]).toEqual(students[2].firstName);
				expect(lastNames[students[2].id]).toEqual(students[2].lastName);
			});
		});

		describe('when trying to create a boardDoAuthorizable on a column without a columnboard as root', () => {
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
