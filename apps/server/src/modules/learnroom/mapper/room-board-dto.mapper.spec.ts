import { userFactory, courseFactory, boardFactory, taskFactory, lessonFactory, setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { User, Task, Lesson, TaskWithStatusVo, Board, Course } from '@shared/domain';
import { RoomBoardDTOMapper } from './room-board-dto.mapper';
import { RoomsAuthorisationService } from '../uc/rooms.authorisation.service';

describe('RoomBoardDTOMapper', () => {
	let orm: MikroORM;
	let mapper: RoomBoardDTOMapper;
	let authorisationService: RoomsAuthorisationService;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomBoardDTOMapper,
				{
					provide: RoomsAuthorisationService,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasTaskReadPermission(user: User, task: Task): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasTaskReadPermission');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasLessonReadPermission(user: User, lesson: Lesson): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasLessonReadPermission');
						},
					},
				},
			],
		}).compile();

		authorisationService = module.get(RoomsAuthorisationService);
		mapper = module.get(RoomBoardDTOMapper);
	});

	describe('mapDTO', () => {
		it('should set roomid', () => {
			const user = userFactory.buildWithId();
			const board = boardFactory.buildWithId();
			const room = courseFactory.buildWithId({ primaryBoard: board, teachers: [user] });

			const result = mapper.mapDTO({ room, board, user });
			expect(result.roomId).toEqual(room.id);
		});

		it('should set displayColor', () => {
			const user = userFactory.buildWithId();
			const board = boardFactory.buildWithId();
			const room = courseFactory.buildWithId({ primaryBoard: board, teachers: [user] });

			const result = mapper.mapDTO({ room, board, user });
			expect(result.displayColor).toEqual(room.color);
		});

		it('should set title', () => {
			const user = userFactory.buildWithId();
			const board = boardFactory.buildWithId();
			const room = courseFactory.buildWithId({ primaryBoard: board, teachers: [user] });

			const result = mapper.mapDTO({ room, board, user });
			expect(result.title).toEqual(room.name);
		});

		describe('when board contains allowed tasks', () => {
			let teacher: User;
			let student: User;
			let board: Board;
			let room: Course;
			let tasks: Task[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				board = boardFactory.buildWithId();
				room = courseFactory.buildWithId({ teachers: [teacher], students: [student], primaryBoard: board });
				tasks = taskFactory.buildList(3, { course: room });
				board.syncTasksFromList(tasks);
				jest.spyOn(authorisationService, 'hasTaskReadPermission').mockImplementation(() => true);
			});

			it('should set each allowed task', () => {
				const result = mapper.mapDTO({ room, board, user: teacher });
				const resultTasks = result.elements.map((el) => {
					const content = el.content as TaskWithStatusVo;
					return content.task;
				});
				expect(resultTasks).toEqual(tasks);
			});

			it('should add status for teacher to task', () => {
				const teacherStatusSpy = jest.spyOn(tasks[0], 'createTeacherStatusForUser');

				mapper.mapDTO({ room, board, user: teacher });
				expect(teacherStatusSpy).toBeCalled();
			});

			it('should add status for student to task', () => {
				const studentStatusSpy = jest.spyOn(tasks[0], 'createStudentStatusForUser');

				mapper.mapDTO({ room, board, user: student });
				expect(studentStatusSpy).toBeCalled();
			});
		});

		describe('when board contains forbidden tasks', () => {
			let teacher: User;
			let student: User;
			let board: Board;
			let room: Course;
			let tasks: Task[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				board = boardFactory.buildWithId();
				room = courseFactory.buildWithId({ teachers: [teacher], students: [student], primaryBoard: board });
				tasks = taskFactory.buildList(3, { course: room });
				board.syncTasksFromList(tasks);
				jest.spyOn(authorisationService, 'hasTaskReadPermission').mockImplementation(() => false);
			});

			it('should not set forbidden tasks for student', () => {
				const result = mapper.mapDTO({ room, board, user: teacher });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for teacher', () => {
				const result = mapper.mapDTO({ room, board, user: student });
				expect(result.elements.length).toEqual(0);
			});
		});

		describe('when board contains allowed lessons', () => {
			let teacher: User;
			let student: User;
			let board: Board;
			let room: Course;
			let lessons: Lesson[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				board = boardFactory.buildWithId();
				room = courseFactory.buildWithId({ teachers: [teacher], students: [student], primaryBoard: board });
				lessons = lessonFactory.buildList(3, { course: room });
				board.syncLessonsFromList(lessons);
				jest.spyOn(authorisationService, 'hasLessonReadPermission').mockImplementation(() => true);
			});

			it('should set lessons for student', () => {
				const result = mapper.mapDTO({ room, board, user: student });
				const resultLessons = result.elements.map((el) => el.content as Lesson);
				expect(result.elements).toEqual(resultLessons);
			});

			it('should set lessons for teacher', () => {
				const result = mapper.mapDTO({ room, board, user: teacher });
				const resultLessons = result.elements.map((el) => el.content as Lesson);
				expect(result.elements).toEqual(resultLessons);
			});
		});

		describe('when board contains allowed lessons', () => {
			let teacher: User;
			let student: User;
			let board: Board;
			let room: Course;
			let lessons: Lesson[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				board = boardFactory.buildWithId();
				room = courseFactory.buildWithId({ teachers: [teacher], students: [student], primaryBoard: board });
				lessons = lessonFactory.buildList(3, { course: room });
				board.syncLessonsFromList(lessons);
				jest.spyOn(authorisationService, 'hasLessonReadPermission').mockImplementation(() => false);
			});

			it('should not set forbidden tasks for student', () => {
				const result = mapper.mapDTO({ room, board, user: teacher });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for teacher', () => {
				const result = mapper.mapDTO({ room, board, user: student });
				expect(result.elements.length).toEqual(0);
			});
		});
	});
});
