import { userFactory, courseFactory, boardFactory, taskFactory, lessonFactory, setupEntities } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { User, Task, Lesson, TaskWithStatusVo, Board, Course } from '@shared/domain';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';
import { RoomBoardElementTypes, TaskMetadataDTO } from '../types';

describe('RoomBoardDTOMapper', () => {
	let orm: MikroORM;
	let mapper: RoomBoardDTOFactory;
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
				RoomBoardDTOFactory,
				{
					provide: RoomsAuthorisationService,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasTaskListPermission(user: User, task: Task): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasTaskReadPermission');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasTaskReadPermission(user: User, task: Task): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasTaskReadPermission');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasLessonListPermission(user: User, lesson: Lesson): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasLessonReadPermission');
						},
					},
				},
			],
		}).compile();

		authorisationService = module.get(RoomsAuthorisationService);
		mapper = module.get(RoomBoardDTOFactory);
	});

	describe('mapDTO', () => {
		it('should set roomid', () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ teachers: [user] });
			const board = boardFactory.buildWithId({ course: room });

			const result = mapper.createDTO({ room, board, user });
			expect(result.roomId).toEqual(room.id);
		});

		it('should set displayColor', () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ teachers: [user] });
			const board = boardFactory.buildWithId({ course: room });

			const result = mapper.createDTO({ room, board, user });
			expect(result.displayColor).toEqual(room.color);
		});

		it('should set title', () => {
			const user = userFactory.buildWithId();
			const room = courseFactory.buildWithId({ teachers: [user] });
			const board = boardFactory.buildWithId({ course: room });

			const result = mapper.createDTO({ room, board, user });
			expect(result.title).toEqual(room.name);
		});

		describe('when board contains allowed tasks', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: Board;
			let room: Course;
			let tasks: Task[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				substitutionTeacher = userFactory.buildWithId();
				room = courseFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					substitutionTeachers: [substitutionTeacher],
				});
				board = boardFactory.buildWithId({ course: room });
				tasks = taskFactory.buildList(3, { course: room });
				board.syncTasksFromList(tasks);
				jest.spyOn(authorisationService, 'hasTaskListPermission').mockImplementation(() => true);
				jest.spyOn(authorisationService, 'hasTaskReadPermission').mockImplementation(() => true);
			});

			it('should set each allowed task for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const resultTasks = result.elements.map((el) => {
					const content = el.content as TaskWithStatusVo;
					return content.task;
				});
				expect(resultTasks).toEqual(tasks);
			});

			it('should set each allowed task for substitution teacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const resultTasks = result.elements.map((el) => {
					const content = el.content as TaskWithStatusVo;
					return content.task;
				});
				expect(resultTasks).toEqual(tasks);
			});

			it('should set each allowed task for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const resultTasks = result.elements.map((el) => {
					const content = el.content as TaskWithStatusVo;
					return content.task;
				});
				expect(resultTasks).toEqual(tasks);
			});

			it('should add status for teacher to task', () => {
				const teacherStatusSpy = jest.spyOn(tasks[0], 'createTeacherStatusForUser');

				mapper.createDTO({ room, board, user: teacher });
				expect(teacherStatusSpy).toBeCalled();
			});

			it('should add status for substitutionTeacher to task', () => {
				const teacherStatusSpy = jest.spyOn(tasks[0], 'createTeacherStatusForUser');

				mapper.createDTO({ room, board, user: substitutionTeacher });
				expect(teacherStatusSpy).toBeCalled();
			});

			it('should add status for student to task', () => {
				const studentStatusSpy = jest.spyOn(tasks[0], 'createStudentStatusForUser');

				mapper.createDTO({ room, board, user: student });
				expect(studentStatusSpy).toBeCalled();
			});
		});

		describe('when board contains invisible tasks', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: Board;
			let room: Course;
			let tasks: Task[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				substitutionTeacher = userFactory.buildWithId();
				room = courseFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					substitutionTeachers: [substitutionTeacher],
				});
				board = boardFactory.buildWithId({ course: room });
				tasks = taskFactory.buildList(3, { course: room });
				board.syncTasksFromList(tasks);
				jest.spyOn(authorisationService, 'hasTaskListPermission').mockImplementation(() => true);
				jest.spyOn(authorisationService, 'hasTaskReadPermission').mockImplementation(() => false);
			});

			it('should set each invisible task as hiddenTaskDTO for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const element = result.elements[0];
				expect(element.type === RoomBoardElementTypes.TaskMetadata);
				const content = element.content as TaskMetadataDTO;
				expect(content.allowed === false);
			});

			it('should not set forbidden tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const element = result.elements[0];
				expect(element.type === RoomBoardElementTypes.TaskMetadata);
				const content = element.content as TaskMetadataDTO;
				expect(content.allowed === false);
			});

			it('should not set forbidden tasks for substitutionTeacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const element = result.elements[0];
				expect(element.type === RoomBoardElementTypes.TaskMetadata);
				const content = element.content as TaskMetadataDTO;
				expect(content.allowed === false);
			});
		});

		describe('when board contains forbidden tasks', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: Board;
			let room: Course;
			let tasks: Task[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				substitutionTeacher = userFactory.buildWithId();
				room = courseFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					substitutionTeachers: [substitutionTeacher],
				});
				board = boardFactory.buildWithId({ course: room });
				tasks = taskFactory.buildList(3, { course: room });
				board.syncTasksFromList(tasks);
				jest.spyOn(authorisationService, 'hasTaskListPermission').mockImplementation(() => false);
				jest.spyOn(authorisationService, 'hasTaskReadPermission').mockImplementation(() => false);
			});

			it('should not set forbidden tasks for student', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: student });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for substitutionTeacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				expect(result.elements.length).toEqual(0);
			});
		});

		describe('when board contains allowed lessons', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: Board;
			let room: Course;
			let lessons: Lesson[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				substitutionTeacher = userFactory.buildWithId();
				room = courseFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					substitutionTeachers: [substitutionTeacher],
				});
				board = boardFactory.buildWithId({ course: room });
				lessons = lessonFactory.buildList(3, { course: room });
				board.syncLessonsFromList(lessons);
				jest.spyOn(authorisationService, 'hasLessonListPermission').mockImplementation(() => true);
			});

			it('should set lessons for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const resultLessons = result.elements.map((el) => el.content as Lesson);
				expect(resultLessons).toEqual(lessons);
			});

			it('should set lessons for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const resultLessons = result.elements.map((el) => el.content as Lesson);
				expect(resultLessons).toEqual(lessons);
			});

			it('should set lessons for substitutionTeacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const resultLessons = result.elements.map((el) => el.content as Lesson);
				expect(resultLessons).toEqual(lessons);
			});
		});

		describe('when board contains forbidden lessons', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: Board;
			let room: Course;
			let lessons: Lesson[];

			beforeEach(() => {
				teacher = userFactory.buildWithId();
				student = userFactory.buildWithId();
				substitutionTeacher = userFactory.buildWithId();
				room = courseFactory.buildWithId({
					teachers: [teacher],
					students: [student],
					substitutionTeachers: [substitutionTeacher],
				});
				board = boardFactory.buildWithId({ course: room });
				lessons = lessonFactory.buildList(3, { course: room });
				board.syncLessonsFromList(lessons);
				jest.spyOn(authorisationService, 'hasLessonListPermission').mockImplementation(() => false);
			});

			it('should not set forbidden tasks for student', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: student });
				expect(result.elements.length).toEqual(0);
			});

			it('should not set forbidden tasks for substitutionTeacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				expect(result.elements.length).toEqual(0);
			});
		});
	});
});
