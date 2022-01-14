import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, taskFactory, setupEntities } from '@shared/testing';
import { BoardMapper } from './board.mapper';
import { BoardResponse, BoardElementResponse } from '../controller/dto/roomBoardResponse';

describe('board mapper', () => {
	let mapper: BoardMapper;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [BoardMapper],
		}).compile();

		mapper = module.get(BoardMapper);
	});
	describe('mapToResponse', () => {
		it('should map plain board into response', () => {
			const course = courseFactory.buildWithId();
			const board = {
				roomId: course.id,
				displayColor: course.color,
				title: course.name,
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
				isSubstitutionTeacher: false,
			};
			const board = {
				roomId: course.id,
				displayColor: course.color,
				title: course.name,
				elements: [{ type: 'task', content: { task, status } }],
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});
	});
});
