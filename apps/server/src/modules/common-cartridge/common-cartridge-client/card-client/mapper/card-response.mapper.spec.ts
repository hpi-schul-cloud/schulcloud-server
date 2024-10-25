import { faker } from '@faker-js/faker';
import { CardResponseMapper } from './card-response.mapper';
import {
	CardListResponse,
	DeletedElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	CollaborativeTextEditorElementResponse,
	CardResponseElementsInner,
} from '../cards-api-client';
import { ContentElementType } from '../enums/content-element-type.enum';
import { CardContentElementInner } from '../types/card-content-elements-inner.type';
import { CardResponseDto } from '../dto/card-response.dto';

describe('CardResponseMapper', () => {
	describe('mapToCardListResponseDto', () => {
		const createMockElement = (
			id: string,
			type: ContentElementType,
			content: CardContentElementInner
		): CardContentElementInner => {
			return {
				id,
				type,
				content,
				timestamps: {
					lastUpdatedAt: '2024-10-01T10:00:00Z',
					createdAt: '2024-10-01T09:00:00Z',
					deletedAt: null,
				},
			};
		};

		it('should map CardListResponse to CardListResponseDto with all types of elements', () => {
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: 'card-1',
						title: 'Card 1',
						height: 200,
						elements: [
							createMockElement(
								'element-1',
								ContentElementType.COLLABORATIVE_TEXT_EDITOR,
								{}
							) as CollaborativeTextEditorElementResponse,
							createMockElement('element-2', ContentElementType.DELETED, {
								title: 'Deleted Title',
								description: 'Deleted Description',
							}) as DeletedElementResponse,
							createMockElement('element-3', ContentElementType.SUBMISSION_CONTAINER, {
								dueDate: '2024-10-10',
							}) as SubmissionContainerElementResponse,
							createMockElement('element-4', ContentElementType.DRAWING, {
								description: 'Sample Drawing',
							}) as DrawingElementResponse,
							createMockElement('element-5', ContentElementType.EXTERNAL_TOOL, {
								contextExternalToolId: 'external-tool-1',
							}) as ExternalToolElementResponse,
							createMockElement('element-6', ContentElementType.FILE, {
								caption: 'Sample Caption',
								alternativeText: 'Sample Alt Text',
							}) as FileElementResponse,
							createMockElement('element-7', ContentElementType.LINK, {
								url: 'https://example.com',
								title: 'Example Title',
								description: 'Sample Description',
								imageUrl: 'https://example.com/image.png',
							}) as LinkElementResponse,
							createMockElement('element-8', ContentElementType.RICH_TEXT, {
								text: 'Rich text content',
								inputFormat: 'Markdown',
							}) as RichTextElementResponse,
							createMockElement(
								'element-unknown',
								'UNKNOWN_TYPE' as ContentElementType,
								{}
							) as CardResponseElementsInner,
						],
						visibilitySettings: { publishedAt: '2024-10-01T12:00:00Z' },
						timestamps: {
							lastUpdatedAt: '2024-10-01T11:00:00Z',
							createdAt: '2024-10-01T10:00:00Z',
							deletedAt: faker.date.recent().toString(),
						},
					},
				],
			};

			const result = CardResponseMapper.mapToCardListResponseDto(mockCardListResponse);
			expect(result).toBeDefined();
			expect(result.data).toHaveLength(1);

			const cardResponseDto = result.data[0];
			expect(cardResponseDto.id).toBe('card-1');
			expect(cardResponseDto.title).toBe('Card 1');
			expect(cardResponseDto.height).toBe(200);
			expect(cardResponseDto.visibilitySettings.publishedAt).toBe('2024-10-01T12:00:00Z');
			expect(cardResponseDto.timeStamps.lastUpdatedAt).toBe('2024-10-01T11:00:00Z');

			expect(cardResponseDto.elements).toHaveLength(8);
			expect(cardResponseDto.elements[0].type).toBe(ContentElementType.COLLABORATIVE_TEXT_EDITOR);
			expect(cardResponseDto.elements[1].type).toBe(ContentElementType.DELETED);
			expect(cardResponseDto.elements[2].type).toBe(ContentElementType.SUBMISSION_CONTAINER);
			expect(cardResponseDto.elements[3].type).toBe(ContentElementType.DRAWING);
			expect(cardResponseDto.elements[4].type).toBe(ContentElementType.EXTERNAL_TOOL);
			expect(cardResponseDto.elements[5].type).toBe(ContentElementType.FILE);
			expect(cardResponseDto.elements[6].type).toBe(ContentElementType.LINK);
			expect(cardResponseDto.elements[7].type).toBe(ContentElementType.RICH_TEXT);
		});

		it('should handle unknown element types without breaking', () => {
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: 'card-2',
						title: 'Card 2',
						height: 150,
						elements: [
							createMockElement(
								'element-unknown',
								'UNKNOWN_TYPE' as ContentElementType,
								{}
							) as CardResponseElementsInner,
						],
						visibilitySettings: { publishedAt: faker.date.past().toISOString() },
						timestamps: {
							lastUpdatedAt: faker.date.past().toISOString(),
							createdAt: faker.date.past().toISOString(),
							deletedAt: faker.date.recent().toString(),
						},
					},
				],
			};

			const result = CardResponseMapper.mapToCardListResponseDto(mockCardListResponse);
			expect(result).toBeDefined();
			expect(result.data).toHaveLength(1);

			const cardResponseDto = result.data[0];
			expect(cardResponseDto.id).toBe('card-2');
			expect(cardResponseDto.title).toBe('Card 2');
			expect(cardResponseDto.height).toBe(150);
			expect(cardResponseDto.elements).toHaveLength(0);
		});
		it('should return an empty list of elements when CardResponse has no elements', () => {
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: 'card-3',
						title: 'Card 3',
						height: 100,
						elements: [],
						visibilitySettings: { publishedAt: '2024-10-03T12:00:00Z' },
						timestamps: {
							lastUpdatedAt: '2024-10-03T11:00:00Z',
							createdAt: '2024-10-03T10:00:00Z',
							deletedAt: faker.date.recent().toString(),
						},
					},
				],
			};

			const result = CardResponseMapper.mapToCardListResponseDto(mockCardListResponse);
			expect(result).toBeDefined();
			expect(result.data).toHaveLength(1);

			const cardResponse: CardResponseDto = result.data[0];
			expect(cardResponse.id).toBe('card-3');
			expect(cardResponse.title).toBe('Card 3');
			expect(cardResponse.height).toBe(100);
			expect(cardResponse.elements).toHaveLength(0);
			expect(cardResponse.visibilitySettings.publishedAt).toBe('2024-10-03T12:00:00Z');
			expect(cardResponse.timeStamps.lastUpdatedAt).toBe('2024-10-03T11:00:00Z');
		});

		it('should cover default switch case and return an empty object', () => {
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: faker.string.uuid(),
						title: faker.lorem.sentence(),
						height: faker.number.int(),
						elements: [
							createMockElement(
								faker.string.uuid(),
								'UNKNOWN_TYPE' as ContentElementType,
								{}
							) as CardResponseElementsInner,
						],
						visibilitySettings: { publishedAt: faker.date.past().toISOString() },
						timestamps: {
							lastUpdatedAt: faker.date.recent().toISOString(),
							createdAt: faker.date.past().toISOString(),
							deletedAt: faker.date.future().toISOString(),
						},
					},
				],
			};

			const result = CardResponseMapper.mapToCardListResponseDto(mockCardListResponse);
			expect(result).toBeDefined();
			expect(result.data).toHaveLength(1);

			const cardResponseDto = result.data[0];
			expect(cardResponseDto.id).toBe(mockCardListResponse.data[0].id);
			expect(cardResponseDto.title).toBe(mockCardListResponse.data[0].title);
			expect(cardResponseDto.height).toBe(mockCardListResponse.data[0].height);
			expect(cardResponseDto.elements).toHaveLength(0);
		});
	});
});
