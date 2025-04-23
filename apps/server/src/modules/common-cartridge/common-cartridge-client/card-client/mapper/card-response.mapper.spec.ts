import { faker } from '@faker-js/faker';
import {
	CardListResponse,
	CardResponseElementsInner,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	VideoConferenceElementResponse,
} from '../cards-api-client';
import { CardResponseDto } from '../dto/card-response.dto';
import { ContentElementType } from '../enums/content-element-type.enum';
import { CardContentElementInner } from '../types/card-content-elements-inner.type';
import { CardResponseMapper } from './card-response.mapper';

describe('CardResponseMapper', () => {
	const createMockElement = (
		id: string,
		type: ContentElementType,
		content: CardContentElementInner
	): CardContentElementInner => {
		const element: CardContentElementInner = {
			id,
			type,
			content,
			timestamps: {
				lastUpdatedAt: faker.date.recent().toISOString(),
				createdAt: faker.date.soon().toISOString(),
				deletedAt: null,
			},
		};

		return element;
	};

	describe('mapToCardListResponseDto', () => {
		const setup = (elementsArray: CardResponseElementsInner[]) => {
			const mockCardListResponse: CardListResponse = {
				data: [
					{
						id: 'card-1',
						title: 'Card 1',
						height: 100,
						elements: elementsArray,
						visibilitySettings: { publishedAt: '2024-10-03T12:00:00Z' },
						timestamps: {
							lastUpdatedAt: '2024-10-03T11:00:00Z',
							createdAt: faker.date.recent().toISOString(),
							deletedAt: faker.date.recent().toString(),
						},
					},
				],
			};
			return mockCardListResponse;
		};

		describe("when various elements' responses are sent to mapper", () => {
			const mockList: CardListResponse = setup([
				createMockElement(
					faker.string.uuid(),
					ContentElementType.COLLABORATIVE_TEXT_EDITOR,
					{}
				) as CollaborativeTextEditorElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.DELETED, {
					title: faker.lorem.sentence(),
					description: faker.lorem.words(),
				}) as DeletedElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.SUBMISSION_CONTAINER, {
					dueDate: faker.date.soon().toISOString(),
				}) as SubmissionContainerElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.DRAWING, {
					description: faker.lorem.word(),
				}) as DrawingElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.EXTERNAL_TOOL, {
					contextExternalToolId: faker.string.uuid(),
				}) as ExternalToolElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.FILE, {
					caption: faker.lorem.sentence(),
					alternativeText: faker.lorem.word(),
				}) as FileElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.FILE_FOLDER, {
					title: faker.lorem.sentence(),
				}) as FileFolderElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.LINK, {
					url: faker.internet.url(),
					title: faker.lorem.word(),
					description: faker.lorem.sentence(),
					imageUrl: faker.internet.url(),
				}) as LinkElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.RICH_TEXT, {
					text: faker.lorem.paragraph(),
					inputFormat: faker.internet.domainName(),
				}) as RichTextElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.VIDEO_CONFERENCE, {
					title: faker.lorem.word(),
				}) as VideoConferenceElementResponse,

				createMockElement(faker.string.uuid(), ContentElementType.H5P, {
					contentId: faker.string.uuid(),
				}) as H5pElementResponse,

				createMockElement(faker.string.uuid(), 'UNKNOWN_TYPE' as ContentElementType, {}) as CardResponseElementsInner,
			]);

			it('should map CardListResponse to CardListResponseDto with all types of elements', () => {
				const result = CardResponseMapper.mapToCardListResponseDto(mockList);
				const cardResponseDto = result.data[0];

				expect(result).toBeDefined();
				expect(result.data).toHaveLength(1);
				expect(cardResponseDto.id).toBe('card-1');
				expect(cardResponseDto.title).toBe('Card 1');
				expect(cardResponseDto.height).toBe(100);
				expect(cardResponseDto.visibilitySettings.publishedAt).toBe('2024-10-03T12:00:00Z');
				expect(cardResponseDto.timeStamps.lastUpdatedAt).toBe('2024-10-03T11:00:00Z');
				expect(cardResponseDto.elements).toHaveLength(11);
				expect(cardResponseDto.elements[0].type).toBe(ContentElementType.COLLABORATIVE_TEXT_EDITOR);
				expect(cardResponseDto.elements[1].type).toBe(ContentElementType.DELETED);
				expect(cardResponseDto.elements[2].type).toBe(ContentElementType.SUBMISSION_CONTAINER);
				expect(cardResponseDto.elements[3].type).toBe(ContentElementType.DRAWING);
				expect(cardResponseDto.elements[4].type).toBe(ContentElementType.EXTERNAL_TOOL);
				expect(cardResponseDto.elements[5].type).toBe(ContentElementType.FILE);
				expect(cardResponseDto.elements[6].type).toBe(ContentElementType.FILE_FOLDER);
				expect(cardResponseDto.elements[7].type).toBe(ContentElementType.LINK);
				expect(cardResponseDto.elements[8].type).toBe(ContentElementType.RICH_TEXT);
				expect(cardResponseDto.elements[9].type).toBe(ContentElementType.VIDEO_CONFERENCE);
				expect(cardResponseDto.elements[10].type).toBe(ContentElementType.H5P);
			});
		});

		describe('when there is an unknown element response to handle', () => {
			const mockList: CardListResponse = setup([
				createMockElement('element-unknown', 'UNKNOWN_TYPE' as ContentElementType, {}) as CardResponseElementsInner,
			]);

			it('should handle unknown element types without breaking', () => {
				const result = CardResponseMapper.mapToCardListResponseDto(mockList);
				const cardResponseDto = result.data[0];

				expect(result).toBeDefined();
				expect(result.data).toHaveLength(1);
				expect(cardResponseDto.id).toBe('card-1');
				expect(cardResponseDto.title).toBe('Card 1');
				expect(cardResponseDto.height).toBe(100);
				expect(cardResponseDto.elements).toHaveLength(0);
			});
		});

		describe('when CardResponse has no elements', () => {
			const mockList: CardListResponse = setup([]);

			it('should return an empty list of elements', () => {
				const result = CardResponseMapper.mapToCardListResponseDto(mockList);
				const cardResponse: CardResponseDto = result.data[0];

				expect(result).toBeDefined();
				expect(result.data).toHaveLength(1);
				expect(cardResponse.id).toBe('card-1');
				expect(cardResponse.title).toBe('Card 1');
				expect(cardResponse.height).toBe(100);
				expect(cardResponse.elements).toHaveLength(0);
				expect(cardResponse.visibilitySettings.publishedAt).toBe('2024-10-03T12:00:00Z');
				expect(cardResponse.timeStamps.lastUpdatedAt).toBe('2024-10-03T11:00:00Z');
			});
		});

		describe('when the publishedAt in visibilitySettings is null', () => {
			const mockList: CardListResponse = setup([]);
			mockList.data[0].visibilitySettings.publishedAt = undefined;

			it('should return an empty string', () => {
				const mapperResult = CardResponseMapper.mapToCardListResponseDto(mockList);
				const cardResponse: CardResponseDto = mapperResult.data[0];

				expect(cardResponse.visibilitySettings.publishedAt).toBe('');
			});
		});
	});
});
