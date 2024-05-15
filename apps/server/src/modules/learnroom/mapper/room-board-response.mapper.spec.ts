import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardLayout } from '@shared/domain/domainobject';
import { courseFactory, setupEntities, taskFactory } from '@shared/testing';
import { BoardElementResponse, SingleColumnBoardResponse } from '../controller/dto';
import { ColumnBoardMetaData, RoomBoardDTO, RoomBoardElementTypes } from '../types';
import { RoomBoardResponseMapper } from './room-board-response.mapper';

describe('room board response mapper', () => {
	let mapper: RoomBoardResponseMapper;
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			imports: [],
			providers: [RoomBoardResponseMapper],
		}).compile();

		mapper = module.get(RoomBoardResponseMapper);
	});

	describe('mapToResponse', () => {
		it('should map plain board into response', () => {
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [],
				isArchived: false,
				isSynchronized: false,
			};

			const result = mapper.mapToResponse(board);

			expect(result instanceof SingleColumnBoardResponse).toEqual(true);
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
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [{ type: RoomBoardElementTypes.TASK, content: { task, status } }],
				isArchived: false,
				isSynchronized: false,
			};

			const result: SingleColumnBoardResponse = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map tasks with status on board to response', () => {
			const course = courseFactory.buildWithId();
			const linkedTask = taskFactory.buildWithId({ course });
			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isFinished: false,
				isSubstitutionTeacher: false,
			};
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [{ type: RoomBoardElementTypes.TASK, content: { task: linkedTask, status } }],
				isArchived: false,
				isSynchronized: false,
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map lessons on board to response', () => {
			const course = courseFactory.buildWithId();
			const lessonMetadata = {
				id: 'lessonId',
				name: 'lesson',
				hidden: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				numberOfPublishedTasks: 1,
				numberOfDraftTasks: 3,
				numberOfPlannedTasks: 5,
				courseName: course.name,
			};
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [{ type: RoomBoardElementTypes.LESSON, content: lessonMetadata }],
				isArchived: false,
				isSynchronized: false,
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map mix of tasks and lessons on board to response', () => {
			const course = courseFactory.buildWithId();
			const lessonMetadata = {
				id: 'lessonId',
				name: 'lesson',
				hidden: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				numberOfPublishedTasks: 1,
				numberOfDraftTasks: 3,
				numberOfPlannedTasks: 5,
				courseName: course.name,
			};
			const task = taskFactory.buildWithId({ course });
			const status = {
				graded: 0,
				maxSubmissions: 0,
				submitted: 0,
				isDraft: false,
				isFinished: false,
				isSubstitutionTeacher: false,
			};
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [
					{ type: RoomBoardElementTypes.LESSON, content: lessonMetadata },
					{ type: RoomBoardElementTypes.TASK, content: { task, status } },
				],
				isArchived: false,
				isSynchronized: false,
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
			expect(result.elements[1] instanceof BoardElementResponse).toEqual(true);
		});

		it('should map column board targets on board to response', () => {
			const columnBoardMetaData: ColumnBoardMetaData = {
				id: new ObjectId().toHexString(),
				columnBoardId: new ObjectId().toHexString(),
				title: 'column board #1',
				published: true,
				layout: BoardLayout.COLUMNS,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			const board: RoomBoardDTO = {
				roomId: 'roomId',
				displayColor: '#ACACAC',
				title: 'boardTitle',
				elements: [{ type: RoomBoardElementTypes.COLUMN_BOARD, content: columnBoardMetaData }],
				isArchived: false,
				isSynchronized: false,
			};

			const result = mapper.mapToResponse(board);

			expect(result.elements[0] instanceof BoardElementResponse).toEqual(true);
		});
	});
});
