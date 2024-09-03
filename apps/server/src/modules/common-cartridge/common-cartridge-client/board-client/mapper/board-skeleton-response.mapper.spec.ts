import { faker } from '@faker-js/faker';
import { BoardResponse, CardSkeletonResponse, ColumnResponse } from '../board-api-client';
import { BoardSkeletonDtoMapper } from './board-skeleton-response.mapper';

describe('BoardSkeletonDtoMapper', () => {
	describe('mapToBoardSkeletonDto', () => {
		describe('when mapping to BoardResponse', () => {
			const setup = () => {
				const cardResponse: CardSkeletonResponse = {
					cardId: faker.string.uuid(),
					height: faker.number.int(),
				};

				const columnResponse: ColumnResponse = {
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					cards: [cardResponse],
					timestamps: {
						createdAt: faker.date.past().toString(),
						lastUpdatedAt: faker.date.recent().toString(),
					},
				};

				const boardResponse: BoardResponse = {
					id: faker.string.uuid(),
					title: faker.lorem.sentence(),
					columns: [columnResponse],
					isVisible: true,
					layout: 'layout',
					timestamps: {
						createdAt: faker.date.past().toString(),
						lastUpdatedAt: faker.date.recent().toString(),
					},
				};

				return { boardResponse };
			};
			it('should return BoardSkeletonDto', () => {
				const { boardResponse } = setup();

				const result = BoardSkeletonDtoMapper.mapToBoardSkeletonDto(boardResponse);

				expect(result).toEqual({
					// AI next 16 lines
					boardId: boardResponse.id,
					title: boardResponse.title,
					isVisible: boardResponse.isVisible,
					layout: boardResponse.layout,
					columns: [
						{
							columnId: boardResponse.columns[0].id,
							title: boardResponse.columns[0].title,
							cards: [
								{
									cardId: boardResponse.columns[0].cards[0].cardId,
									height: boardResponse.columns[0].cards[0].height,
								},
							],
						},
					],
				});
			});
		});
	});
});
