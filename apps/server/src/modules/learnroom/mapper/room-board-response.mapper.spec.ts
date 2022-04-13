import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '@shared/testing';
import { BoardElementResponse, BoardResponse } from '../controller/dto/board-task.response';
import { RoomBoardElementTypes } from '../types';
import { RoomBoardResponseMapper } from './room-board-response.mapper';

describe('room board response mapper', () => {
	let mapper: RoomBoardResponseMapper;
	let module: TestingModule;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterEach(async () => {
		await module.close();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [RoomBoardResponseMapper],
		}).compile();

		mapper = module.get(RoomBoardResponseMapper);
	});

	describe('mapToResponse', () => {
		it('should map plain board into response', () => {
			const course = courseFactory.buildWithId();
			const board = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				courseName: course.name,
				elements: [],
			};

			const result = mapper.mapToResponse(board);

			expect(result instanceof BoardResponse).toEqual(true);
		});

		it('should map tasks with status on board to response', () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.buildWithId({ course });
			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isFinished: false,
				isSubstitutionTeacher: false,
			};
			const board = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				courseName: course.name,
				elements: [{ type: RoomBoardElementTypes.TASK, content: { task, status } }],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map locked task on board to response', () => {
			const course = courseFactory.buildWithId();
			const task = taskFactory.buildWithId({ course });
			const board = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				courseName: course.name,
				elements: [
					{ type: RoomBoardElementTypes.LOCKEDTASK, content: { id: task.id, name: task.name, allowed: false } },
				],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map lessons on board to response', () => {
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course, hidden: true });
			const board = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				courseName: course.name,
				elements: [{ type: RoomBoardElementTypes.LESSON, content: lesson }],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map mix of tasks and lessons on board to response', () => {
			const course = courseFactory.buildWithId();
			const lesson = lessonFactory.buildWithId({ course, hidden: true });
			const task = taskFactory.buildWithId({ course });
			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isFinished: false,
				isSubstitutionTeacher: false,
			};
			const board = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				courseName: course.name,
				elements: [
					{ type: RoomBoardElementTypes.LESSON, content: lesson },
					{ type: RoomBoardElementTypes.TASK, content: { task, status } },
				],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
			expect(result.elements[1] instanceof BoardElementResponse).toEqual(true);
		});
	});
});
