import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, taskFactory, setupEntities } from '@shared/testing';
import { RoomBoardResponseMapper } from './room-board-response.mapper';
import { BoardResponse, BoardElementResponse } from '../controller/dto/roomBoardResponse';

describe('room board response mapper', () => {
	let mapper: RoomBoardResponseMapper;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
				elements: [{ type: 'task', content: { task, status } }],
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
				elements: [{ type: 'lesson', content: lesson }],
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
					{ type: 'lesson', content: lesson },
					{ type: 'task', content: { task, status } },
				],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
			expect(result.elements[1] instanceof BoardElementResponse).toEqual(true);
		});
	});
});
