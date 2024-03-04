import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IConfig } from '@hpi-schul-cloud/commons/lib/interfaces/IConfig';
import { AuthorizationService } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyBoard, Course, LessonEntity, Task, TaskWithStatusVo, User } from '@shared/domain/entity';
import {
	boardFactory,
	columnboardBoardElementFactory,
	courseFactory,
	lessonBoardElementFactory,
	lessonFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { LessonMetaData } from '../types';
import { RoomBoardDTOFactory } from './room-board-dto.factory';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

describe(RoomBoardDTOFactory.name, () => {
	let module: TestingModule;
	let mapper: RoomBoardDTOFactory;
	let roomsAuthorisationService: RoomsAuthorisationService;
	let authorisationService: DeepMocked<AuthorizationService>;
	let configBefore: IConfig;

	afterAll(async () => {
		await module.close();
		Configuration.reset(configBefore);
	});

	beforeAll(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomBoardDTOFactory,
				{
					provide: RoomsAuthorisationService,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasTaskReadPermission(user: User, task: Task): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasTaskReadPermission');
						},
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						hasLessonReadPermission(user: User, lesson: LessonEntity): boolean {
							throw new Error('Please write a mock for RoomsAuthorisationService.hasLessonReadPermission');
						},
					},
				},
				{ provide: AuthorizationService, useValue: createMock<AuthorizationService>() },
			],
		}).compile();

		roomsAuthorisationService = module.get(RoomsAuthorisationService);
		authorisationService = module.get(AuthorizationService);
		mapper = module.get(RoomBoardDTOFactory);
		await setupEntities();
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
			let board: LegacyBoard;
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
				board.syncBoardElementReferences(tasks);
				jest.spyOn(roomsAuthorisationService, 'hasTaskReadPermission').mockImplementation(() => true);
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

		describe('when board contains forbidden tasks', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: LegacyBoard;
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
				board.syncBoardElementReferences(tasks);
				jest.spyOn(roomsAuthorisationService, 'hasTaskReadPermission').mockImplementation(() => false);
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
			let board: LegacyBoard;
			let room: Course;
			let lessons: LessonEntity[];

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
				board.syncBoardElementReferences(lessons);
				jest.spyOn(roomsAuthorisationService, 'hasLessonReadPermission').mockImplementation(() => true);
			});

			it('should set lessons for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				expect(result.elements.length).toEqual(3);
			});

			it('should set lessons for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				expect(result.elements.length).toEqual(3);
			});

			it('should set lessons for substitutionTeacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				expect(result.elements.length).toEqual(3);
			});
		});

		describe('when board contains lesson with tasks', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: LegacyBoard;
			let room: Course;
			let lesson: LessonEntity;
			const inOneDay = new Date(Date.now() + 8.64e7);

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
				lesson = lessonFactory.build({ course: room });
				taskFactory.buildList(1, { course: room, lesson });
				taskFactory.buildList(3, { course: room, lesson, availableDate: inOneDay });
				taskFactory.draft().buildList(5, { course: room, lesson });
				board.syncBoardElementReferences([lesson]);
				jest.spyOn(roomsAuthorisationService, 'hasLessonReadPermission').mockImplementation(() => true);
			});

			it('should set number of published tasks for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPublishedTasks).toEqual(1);
			});

			it('should not set number of planned tasks for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPlannedTasks).toBeUndefined();
			});

			it('should not set number of draft tasks for student', () => {
				const result = mapper.createDTO({ room, board, user: student });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfDraftTasks).toBeUndefined();
			});

			it('should set number of published tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPublishedTasks).toEqual(1);
			});

			it('should set number of planned tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPlannedTasks).toEqual(3);
			});

			it('should set number of draft tasks for teacher', () => {
				const result = mapper.createDTO({ room, board, user: teacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfDraftTasks).toEqual(5);
			});

			it('should set number of published tasks for substitution teacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPublishedTasks).toEqual(1);
			});

			it('should set number of planned tasks for substitution teacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfPlannedTasks).toEqual(3);
			});

			it('should set number of draft tasks for substitution teacher', () => {
				const result = mapper.createDTO({ room, board, user: substitutionTeacher });
				const lessonElement = result.elements[0].content as LessonMetaData;
				expect(lessonElement.numberOfDraftTasks).toEqual(5);
			});
		});

		describe('when board contains forbidden lessons', () => {
			let teacher: User;
			let student: User;
			let substitutionTeacher: User;
			let board: LegacyBoard;
			let room: Course;
			let lessons: LessonEntity[];

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
				board.syncBoardElementReferences(lessons);
				jest.spyOn(roomsAuthorisationService, 'hasLessonReadPermission').mockImplementation(() => false);
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

		describe('when board contains allowed column boards', () => {
			const setup = () => {
				const user = userFactory.build();
				const room = courseFactory.build();
				const columnboardBoardElements = columnboardBoardElementFactory.buildList(5);
				const lessonElement = lessonBoardElementFactory.buildWithId();
				const board = boardFactory.buildWithId({ references: [lessonElement, ...columnboardBoardElements] });

				jest.spyOn(roomsAuthorisationService, 'hasLessonReadPermission').mockReturnValue(true);
				authorisationService.hasPermission.mockReturnValue(true);

				return { user, room, board };
			};

			describe('when ColumnBoard-feature is disabled', () => {
				it('should set lessons for student', () => {
					const { user, room, board } = setup();

					Configuration.set('FEATURE_COLUMN_BOARD_ENABLED', false);

					const result = mapper.createDTO({ room, board, user });
					expect(result.elements.length).toEqual(1);
				});
			});

			describe('when ColumnBoard-feature is enabled', () => {
				it('should set lessons for student', () => {
					const { user, room, board } = setup();

					Configuration.set('FEATURE_COLUMN_BOARD_ENABLED', true);

					const result = mapper.createDTO({ room, board, user });
					expect(result.elements.length).toEqual(6);
				});
			});
		});
	});
});
