import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { BoardNodeRepo } from '../repo';
import { columnBoardFactory, columnFactory } from '../testing';
import { BoardContextService } from './board-context.service';
import { BoardNodeAuthorizableService } from './board-node-authorizable.service';
import { BoardNodeService } from './board.node.service';

// TODO fix test

describe(BoardNodeAuthorizableService.name, () => {
	let module: TestingModule;
	let service: BoardNodeAuthorizableService;
	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	// let boardContextService: DeepMocked<BoardContextService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeAuthorizableService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardContextService,
					useValue: createMock<BoardContextService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeAuthorizableService);
		boardNodeRepo = module.get(BoardNodeRepo);
		boardNodeService = module.get(BoardNodeService);
		// boardContextService = module.get(BoardContextService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when finding a board domainobject', () => {
			const setup = () => {
				const column = columnFactory.build();
				const columnBoard = columnBoardFactory.build({ children: [column] });
				boardNodeRepo.findById.mockResolvedValueOnce(column);
				boardNodeService.findParent.mockResolvedValueOnce(columnBoard);
				boardNodeService.findRoot.mockResolvedValueOnce(columnBoard);

				return { columnBoardId: columnBoard.id, columnId: column.id };
			};

			it('should call the repository', async () => {
				const { columnId } = setup();

				await service.findById(columnId);

				expect(boardNodeRepo.findById).toHaveBeenCalledWith(columnId, 1);
			});

			it('should return authorizable with the column board id', async () => {
				const { columnBoardId, columnId } = setup();

				const result = await service.findById(columnId);

				expect(result.id).toEqual(columnBoardId);
			});
		});
	});

	// describe('getBoardAuthorizable', () => {
	// 	describe('when having an empty board', () => {
	// 		const setup = () => {
	// 			const course = courseFactory.build();
	// 			const board = columnBoardFactory.build();
	// 			return { board, course };
	// 		};

	// 		it('should return an empty usergroup', async () => {
	// 			const { board, course } = setup();
	// 			boardNodeRepo.findById.mockResolvedValueOnce(board);
	// 			courseRepo.findById.mockResolvedValueOnce(course);

	// 			const userGroup = await service.getBoardAuthorizable(board);

	// 			expect(userGroup.id).toEqual(board.id);
	// 			expect(userGroup.users.length).toEqual(0);
	// 		});
	// 	});

	// 	describe('when having a board with a teacher and some students', () => {
	// 		const setup = () => {
	// 			const roles = roleFactory.buildList(1, {});
	// 			const teacher = userFactory.buildWithId({ roles });
	// 			const substitutionTeacher = userFactory.buildWithId({ roles });
	// 			const students = userFactory.buildListWithId(3);
	// 			const course = courseFactory.buildWithId({
	// 				teachers: [teacher],
	// 				substitutionTeachers: [substitutionTeacher],
	// 				students,
	// 			});
	// 			const board = columnBoardFactory.build({ context: { type: BoardExternalReferenceType.Course, id: course.id } });
	// 			boardNodeRepo.findById.mockResolvedValueOnce(board);
	// 			courseRepo.findById.mockResolvedValueOnce(course);
	// 			return {
	// 				board,
	// 				teacherId: teacher.id,
	// 				substitutionTeacherId: substitutionTeacher.id,
	// 				studentIds: students.map((s) => s.id),
	// 				teacher,
	// 				substitutionTeacher,
	// 				students,
	// 			};
	// 		};

	// 		it('should return the teacher and the students with correct roles', async () => {
	// 			const { board, teacherId, substitutionTeacherId, studentIds } = setup();

	// 			const boardNodeAuthorizable = await service.getBoardAuthorizable(board);
	// 			const userPermissions = boardNodeAuthorizable.users.reduce((map, user) => {
	// 				map[user.userId] = user.roles;
	// 				return map;
	// 			}, {});

	// 			expect(boardNodeAuthorizable.users).toHaveLength(5);
	// 			expect(userPermissions[teacherId]).toEqual([BoardRoles.EDITOR]);
	// 			expect(userPermissions[substitutionTeacherId]).toEqual([BoardRoles.EDITOR]);
	// 			expect(userPermissions[studentIds[0]]).toEqual([BoardRoles.READER]);
	// 			expect(userPermissions[studentIds[1]]).toEqual([BoardRoles.READER]);
	// 			expect(userPermissions[studentIds[2]]).toEqual([BoardRoles.READER]);
	// 		});

	// 		it('should return the users with their names', async () => {
	// 			const { board, teacher, substitutionTeacher, students } = setup();

	// 			const boardDoAuthorizable = await service.getBoardAuthorizable(board);
	// 			const firstNames = boardDoAuthorizable.users.reduce((map, user) => {
	// 				map[user.userId] = user.firstName;
	// 				return map;
	// 			}, {});

	// 			const lastNames = boardDoAuthorizable.users.reduce((map, user) => {
	// 				map[user.userId] = user.lastName;
	// 				return map;
	// 			}, {});

	// 			expect(boardDoAuthorizable.users).toHaveLength(5);
	// 			expect(firstNames[teacher.id]).toEqual(teacher.firstName);
	// 			expect(lastNames[teacher.id]).toEqual(teacher.lastName);
	// 			expect(firstNames[substitutionTeacher.id]).toEqual(substitutionTeacher.firstName);
	// 			expect(lastNames[substitutionTeacher.id]).toEqual(substitutionTeacher.lastName);
	// 			expect(firstNames[students[0].id]).toEqual(students[0].firstName);
	// 			expect(lastNames[students[0].id]).toEqual(students[0].lastName);
	// 			expect(firstNames[students[1].id]).toEqual(students[1].firstName);
	// 			expect(lastNames[students[1].id]).toEqual(students[1].lastName);
	// 			expect(firstNames[students[2].id]).toEqual(students[2].firstName);
	// 			expect(lastNames[students[2].id]).toEqual(students[2].lastName);
	// 		});

	// 		it('should return the boardNode', async () => {
	// 			const { board } = setup();

	// 			const boardDoAuthorizable = await service.getBoardAuthorizable(board);

	// 			expect(boardDoAuthorizable.boardNode).toEqual(board);
	// 		});

	// 		it('should return the parentNode', async () => {
	// 			setup();
	// 			const column = columnFactory.build();
	// 			const card = cardFactory.build();

	// 			// boardNodeRepo.findParentOfId.mockResolvedValueOnce(column);

	// 			const boardDoAuthorizable = await service.getBoardAuthorizable(card);

	// 			expect(boardDoAuthorizable.parentNode).toEqual(column);
	// 		});

	// 		it('should return the rootDo', async () => {
	// 			const { board } = setup();
	// 			const column = columnFactory.build();
	// 			boardNodeRepo.getAncestorIds.mockResolvedValueOnce([column.id, board.id]);
	// 			boardNodeRepo.findById.mockResolvedValueOnce(board);

	// 			const boardDoAuthorizable = await service.getBoardAuthorizable(board);

	// 			expect(boardDoAuthorizable.rootDo).toEqual(board);
	// 		});
	// 	});

	// 	// describe('when trying to create a boardDoAuthorizable on a column without a columnboard as root', () => {
	// 	// 	const setup = () => {
	// 	// 		const roles = roleFactory.buildList(1, {});
	// 	// 		const teacher = userFactory.buildWithId({ roles });
	// 	// 		const students = userFactory.buildListWithId(3);
	// 	// 		const column = columnFactory.build();

	// 	// 		boardNodeRepo.getAncestorIds.mockResolvedValueOnce([]);
	// 	// 		boardNodeRepo.findById.mockResolvedValueOnce(column);

	// 	// 		return { column, teacherId: teacher.id, studentIds: students.map((s) => s.id) };
	// 	// 	};

	// 	// 	it('should throw an error', async () => {
	// 	// 		const { column } = setup();

	// 	// 		await expect(() => service.getBoardAuthorizable(column)).rejects.toThrowError();
	// 	// 	});
	// 	// });

	// 	// describe('when having a board that does not reference a course', () => {
	// 	// 	const setup = () => {
	// 	// 		const teacher = userFactory.buildWithId();
	// 	// 		const board = columnBoardFactory.withoutContext().build();
	// 	// 		boardNodeRepo.findById.mockResolvedValueOnce(board);
	// 	// 		boardNodeRepo.getAncestorIds.mockResolvedValueOnce([board.id]);
	// 	// 		return { board, teacherId: teacher.id };
	// 	// 	};

	// 	// 	it('should return an boardDoAuthorizable without user-entries', async () => {
	// 	// 		const { board } = setup();

	// 	// 		const boardDoAuthorizable = await service.getBoardAuthorizable(board);
	// 	// 		expect(boardDoAuthorizable.users).toHaveLength(0);
	// 	// 	});
	// 	// });
	// });

	// describe('when having a media board bound to a user', () => {
	// 	const setup = () => {
	// 		const user = userFactory.buildWithId();
	// 		const board = mediaBoardFactory.build({ context: { type: BoardExternalReferenceType.User, id: user.id } });

	// 		boardNodeRepo.findById.mockResolvedValueOnce(board);
	// 		boardNodeRepo.getAncestorIds.mockResolvedValueOnce([board.id]);

	// 		return {
	// 			user,
	// 			board,
	// 		};
	// 	};

	// 	it('should return the boardDoAuthorizable', async () => {
	// 		const { board, user } = setup();

	// 		const boardDoAuthorizable = await service.getBoardAuthorizable(board);

	// 		expect(boardDoAuthorizable.getProps()).toEqual<BoardDoAuthorizableProps>({
	// 			id: board.id,
	// 			boardDo: board,
	// 			users: [
	// 				{
	// 					userId: user.id,
	// 					roles: [BoardRoles.EDITOR],
	// 				},
	// 			],
	// 			rootDo: board,
	// 		});
	// 	});
	// });
});
