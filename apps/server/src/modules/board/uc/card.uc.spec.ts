import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	textElementFactory,
} from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { BoardDoService, ColumnBoardService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let cardService: DeepMocked<CardService>;
	let columnBoardService: DeepMocked<ColumnBoardService>;
	let boardDoService: DeepMocked<BoardDoService>;
	let elementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoService>(),
				},
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		cardService = module.get(CardService);
		columnBoardService = module.get(ColumnBoardService);
		boardDoService = module.get(BoardDoService);
		elementService = module.get(ContentElementService);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('finding many cards', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const cards = cardFactory.buildList(3);
			const cardIds = cards.map((c) => c.id);

			return { user, cards, cardIds };
		};

		it('should call the service', async () => {
			const { user, cardIds } = setup();

			await uc.findCards(user.id, cardIds);

			expect(cardService.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the card objects', async () => {
			const { user, cards, cardIds } = setup();
			cardService.findByIds.mockResolvedValueOnce(cards);

			const result = await uc.findCards(user.id, cardIds);

			expect(result).toEqual(cards);
		});
	});

	describe('creating a card', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const board = columnBoardFactory.build();
			const column = columnFactory.build();
			const card = cardFactory.build();
			return { user, board, column, card };
		};

		it('should call the service', async () => {
			const { user, board, column } = setup();

			await uc.createCard(user.id, board.id, column.id);

			expect(columnBoardService.createCard).toHaveBeenCalledWith(board.id, column.id);
		});

		it('should return the card object', async () => {
			const { user, board, column, card } = setup();
			columnBoardService.createCard.mockResolvedValueOnce(card);

			const result = await uc.createCard(user.id, board.id, column.id);

			expect(result).toEqual(card);
		});
	});

	describe('deleting a card', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();
			const column = columnFactory.buildWithId();

			return { user, column, card };
		};

		it('should succeed when parent is found', async () => {
			const { user, card, column } = setup();

			boardDoService.findParentOfId.mockResolvedValue(column);

			await uc.deleteCard(user.id, card.id);

			expect(boardDoService.findParentOfId).toHaveBeenCalledWith(card.id);
			expect(boardDoService.deleteChild).toHaveBeenCalledWith(column, card.id);
		});

		it('should throw error if parent is not found', async () => {
			const { user, card } = setup();
			const expectedError = new NotFoundException(`card has no parent`);

			boardDoService.findParentOfId.mockResolvedValue(undefined);

			await expect(uc.deleteCard(user.id, card.id)).rejects.toThrowError(expectedError);
		});
	});

	describe('creating a content element', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();
			return { user, card };
		};

		it('should call the service to find the card', async () => {
			const { user, card } = setup();

			await uc.createElement(user.id, card.id);

			expect(cardService.findById).toHaveBeenCalledWith(card.id);
		});

		it('should call the service to create the content element', async () => {
			const { user, card } = setup();
			cardService.findById.mockResolvedValueOnce(card);

			await uc.createElement(user.id, card.id);

			expect(elementService.createElement).toHaveBeenCalledWith(card.id);
		});
	});

	describe('deleting a content element', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const contentElement = textElementFactory.buildWithId();
			const card = cardFactory.build();

			return { user, card, contentElement };
		};

		it('should delete element', async () => {
			const { user, card, contentElement } = setup();

			cardService.findById.mockResolvedValue(card);

			await uc.deleteElement(user.id, card.id, contentElement.id);

			expect(cardService.findById).toHaveBeenCalledWith(card.id);
			expect(boardDoService.deleteChild).toHaveBeenCalledWith(card, contentElement.id);
		});
	});
});
