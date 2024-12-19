import { faker } from '@faker-js/faker';
import { BoardTaskStatusResponse } from '../room-api-client';
import { BoardTaskStatusMapper } from './board-task-status-dto.mapper';
import { BoardTaskStatusDto } from '../dto';

describe(BoardTaskStatusMapper.name, () => {
	describe('mapBoardTaskStatusToDto', () => {
		it('should map BoardTaskStatusResponse to BoardTaskStatusDto', () => {
			const statusResponse: BoardTaskStatusResponse = {
				submitted: faker.number.int(),
				maxSubmissions: faker.number.int(),
				graded: faker.number.int(),
				isDraft: faker.datatype.boolean(),
				isSubstitutionTeacher: faker.datatype.boolean(),
				isFinished: faker.datatype.boolean(),
			};

			const statusDto = BoardTaskStatusMapper.mapBoardTaskStatusToDto(statusResponse);

			expect(statusDto).toBeInstanceOf(BoardTaskStatusDto);
			expect(statusDto).toEqual(statusResponse);
		});
	});
});
