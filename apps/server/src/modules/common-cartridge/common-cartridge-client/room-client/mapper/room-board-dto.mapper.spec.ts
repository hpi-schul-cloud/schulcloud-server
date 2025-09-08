import { faker } from '@faker-js/faker';
import {
	BoardColumnBoardResponse,
	BoardElementResponse,
	BoardElementResponseType,
	BoardLessonResponse,
	BoardTaskResponse,
	SingleColumnBoardResponse,
} from '../room-api-client';
import { RoomBoardDtoMapper } from './room-board-dto.mapper';
import { BoardTaskStatusDto } from '../dto';

describe(RoomBoardDtoMapper.name, () => {
	describe('mapResponseToRoomBoardDto', () => {
		describe('when response contains tasks', () => {
			const setup = () => {
				const task: BoardTaskResponse = {
					id: faker.string.uuid(),
					name: faker.lorem.word(),
					createdAt: faker.date.recent().toString(),
					updatedAt: faker.date.recent().toString(),
					status: new BoardTaskStatusDto({
						submitted: faker.number.int(),
						maxSubmissions: faker.number.int(),
						graded: faker.number.int(),
						isDraft: faker.datatype.boolean(),
						isSubstitutionTeacher: faker.datatype.boolean(),
						isFinished: faker.datatype.boolean(),
					}),
					availableDate: faker.date.recent().toString(),
					courseName: faker.lorem.word(),
					description: faker.lorem.word(),
					displayColor: faker.lorem.word(),
					dueDate: faker.date.recent().toString(),
				};
				const boardElementResponse: BoardElementResponse = {
					type: BoardElementResponseType.TASK,
					content: {
						...task,
					},
				};
				const response: SingleColumnBoardResponse = {
					roomId: faker.string.uuid(),
					title: faker.lorem.word(),
					displayColor: faker.lorem.word(),
					elements: [boardElementResponse],
					isArchived: faker.datatype.boolean(),
					isSynchronized: faker.datatype.boolean(),
				};

				return { response, task };
			};
			it('should map response to RoomBoardDto with tasks elements', () => {
				const { response, task } = setup();
				const result = RoomBoardDtoMapper.mapResponseToRoomBoardDto(response);

				expect(result.elements[0].content.id).toEqual(task.id);
				expect(result.elements[0].content.createdAt).toEqual(task.createdAt);
				expect(result.elements[0].content.updatedAt).toEqual(task.updatedAt);
			});
		});

		describe('when response contains lessons', () => {
			const setup = () => {
				const lesson: BoardLessonResponse = {
					id: faker.string.uuid(),
					name: faker.lorem.word(),
					courseName: faker.lorem.word(),
					numberOfPublishedTasks: faker.number.int(),
					numberOfDraftTasks: faker.number.int(),
					numberOfPlannedTasks: faker.number.int(),
					createdAt: faker.date.recent().toString(),
					updatedAt: faker.date.recent().toString(),
					hidden: faker.datatype.boolean(),
				};
				const boardElementResponse: BoardElementResponse = {
					type: BoardElementResponseType.LESSON,
					content: {
						...lesson,
					},
				};
				const response: SingleColumnBoardResponse = {
					roomId: faker.string.uuid(),
					title: faker.lorem.word(),
					displayColor: faker.lorem.word(),
					elements: [boardElementResponse],
					isArchived: faker.datatype.boolean(),
					isSynchronized: faker.datatype.boolean(),
				};

				return { response, lesson };
			};

			it('should map response to RoomBoardDto with lesson elements', () => {
				const { response, lesson } = setup();
				const result = RoomBoardDtoMapper.mapResponseToRoomBoardDto(response);

				expect(result.elements[0].content.id).toEqual(lesson.id);
				expect(result.elements[0].content.createdAt).toEqual(lesson.createdAt);
				expect(result.elements[0].content.updatedAt).toEqual(lesson.updatedAt);
			});
		});

		describe('when response contains columnboards', () => {
			const setup = () => {
				const columnBoard: BoardColumnBoardResponse = {
					id: faker.string.uuid(),
					title: faker.lorem.word(),
					createdAt: faker.date.recent().toString(),
					updatedAt: faker.date.recent().toString(),
					published: faker.datatype.boolean(),
					columnBoardId: faker.string.uuid(),
					layout: faker.lorem.word(),
				};
				const boardElementResponse: BoardElementResponse = {
					type: BoardElementResponseType.COLUMN_BOARD,
					content: {
						...columnBoard,
					},
				};
				const response: SingleColumnBoardResponse = {
					roomId: faker.string.uuid(),
					title: faker.lorem.word(),
					displayColor: faker.lorem.word(),
					elements: [boardElementResponse],
					isArchived: faker.datatype.boolean(),
					isSynchronized: faker.datatype.boolean(),
				};

				return { response, columnBoard };
			};

			it('should map response to RoomBoardDto with columnboard elements', () => {
				const { response, columnBoard } = setup();
				const result = RoomBoardDtoMapper.mapResponseToRoomBoardDto(response);

				expect(result.elements[0].content.id).toEqual(columnBoard.id);
				expect(result.elements[0].content.createdAt).toEqual(columnBoard.createdAt);
				expect(result.elements[0].content.updatedAt).toEqual(columnBoard.updatedAt);
			});
		});
	});
});
