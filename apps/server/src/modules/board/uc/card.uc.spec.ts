import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory, columnBoardFactory, columnFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ContentElementService } from '../service';
import { CardService } from '../service/card.service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let cardService: DeepMocked<CardService>;
	let elementService: DeepMocked<ContentElementService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: ContentElementService,
					useValue: createMock<ContentElementService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		cardService = module.get(CardService);
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

			expect(cardService.createCard).toHaveBeenCalledWith(board.id, column.id);
		});

		it('should return the card object', async () => {
			const { user, board, column, card } = setup();
			cardService.createCard.mockResolvedValueOnce(card);

			const result = await uc.createCard(user.id, board.id, column.id);

			expect(result).toEqual(card);
		});
	});

	describe('creating a content element', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const card = cardFactory.build();
			return { user, card };
		};

		it('should call the service to find tha card', async () => {
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
});
