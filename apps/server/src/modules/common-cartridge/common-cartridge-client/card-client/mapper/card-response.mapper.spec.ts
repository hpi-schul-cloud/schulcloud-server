import { faker } from '@faker-js/faker';
import { CardResponseMapper } from './card-response.mapper';
import { CardListResponse } from '../cards-api-client';
import { ContentElementType } from '../enums/content-element-type.enum';
import { CardResponseDto } from '../dto/card-response.dto';

describe('CardResponseMapper', () => {
	describe('mapToCardListResponseDto', () => {
		it('should map CardListResponse to CardListResponseDto correctly', () => {
			// Mock data for CardListResponse
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: 'card-1',
						title: 'Card 1',
						height: 200,
						elements: [
							{
								id: 'element-1',
								type: ContentElementType.RICH_TEXT,
								content: {
									text: faker.string.alphanumeric.toString(),
									inputFormat: 'HTML',
								},
								timestamps: {
									lastUpdatedAt: faker.date.anytime.toString(),
									createdAt: faker.date.anytime.toString(),
									deletedAt: '',
								},
							},
						],
						visibilitySettings: {
							publishedAt: '2024-10-01T12:00:00Z',
						},
						timestamps: {
							lastUpdatedAt: '2024-10-01T11:00:00Z',
							createdAt: faker.date.anytime.toString(),
							deletedAt: faker.date.anytime.toString(),
						},
					},
				],
			};

			const result = CardResponseMapper.mapToCardListResponseDto(mockCardListResponse);
			expect(result).toBeDefined();
			expect(result.data).toHaveLength(1);

			const cardResponseDto: CardResponseDto = result.data[0];
			expect(cardResponseDto.id).toBe('card-1');
			expect(cardResponseDto.title).toBe('Card 1');
			expect(cardResponseDto.height).toBe(200);
			expect(cardResponseDto.elements).toHaveLength(1);
			expect(cardResponseDto.visibilitySettings.publishedAt).toBe('2024-10-01T12:00:00Z');
			expect(cardResponseDto.timeStamps.lastUpdatedAt).toBe('2024-10-01T11:00:00Z');
		});
	});
});
