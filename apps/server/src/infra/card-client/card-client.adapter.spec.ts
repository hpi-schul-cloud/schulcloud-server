import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardCardApi, BoardElementApi, ContentElementType } from './generated';
import { CardClientAdapter } from '.';
import { faker } from '@faker-js/faker/.';

describe(CardClientAdapter.name, () => {
	let module: TestingModule;
	let sut: CardClientAdapter;

	const cardApiMock = createMock<BoardCardApi>();
	const boardElementApiMock = createMock<BoardElementApi>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardClientAdapter,
				{
					provide: BoardElementApi,
					useValue: boardElementApiMock,
				},
				{
					provide: BoardCardApi,
					useValue: cardApiMock,
				},
			],
		}).compile();
		sut = module.get(CardClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	it('should have a cardApi', () => {
		expect(sut['cardApi']).toStrictEqual(cardApiMock);
	});

	describe('createCardElement', () => {
		describe('when creating a card element', () => {
			const setup = () => {
				const cardId = faker.string.uuid();
				const createContentElementBodyParams = {
					type: ContentElementType.RICH_TEXT,
					toPosition: 1,
				};

				return {
					cardId,
					createContentElementBodyParams,
				};
			};

			it('should call cardApi.cardControllerCreateElement', async () => {
				const { cardId, createContentElementBodyParams } = setup();

				await sut.createCardElement(cardId, createContentElementBodyParams);

				expect(cardApiMock.cardControllerCreateElement).toHaveBeenCalledWith(cardId, createContentElementBodyParams);
			});
		});
	});

	describe('updateCardTitle', () => {
		describe('when updating a card title', () => {
			const setup = () => {
				const cardId = faker.string.uuid();
				const renameBodyParams = {
					title: faker.lorem.words(),
				};

				return {
					cardId,
					renameBodyParams,
				};
			};

			it('should call cardApi.cardControllerUpdateCardTitle', async () => {
				const { cardId, renameBodyParams } = setup();

				await sut.updateCardTitle(cardId, renameBodyParams);

				expect(cardApiMock.cardControllerUpdateCardTitle).toHaveBeenCalledWith(cardId, renameBodyParams);
			});
		});
	});

	describe('updateCardElement', () => {
		describe('when updating a card element', () => {
			const setup = () => {
				const elementId = faker.string.uuid();
				const updateElementContentBodyParams = {
					data: {
						type: ContentElementType.RICH_TEXT,
						content: {
							inputFormat: 'richText',
							text: faker.lorem.words(),
						},
					},
				};

				return {
					elementId,
					updateElementContentBodyParams,
				};
			};

			it('should call elementAPI.elementControllerUpdateElement', async () => {
				const { elementId, updateElementContentBodyParams } = setup();

				await sut.updateCardElement(elementId, updateElementContentBodyParams);

				expect(boardElementApiMock.elementControllerUpdateElement).toHaveBeenCalledWith(
					elementId,
					updateElementContentBodyParams
				);
			});
		});
	});
});
