import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoService, ContentElementService } from '../service';
import { CardService } from '../service/card.service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let cardService: DeepMocked<CardService>;
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

			expect(elementService.create).toHaveBeenCalledWith(card.id);
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
			expect(boardDoService.deleteChildWithDescendants).toHaveBeenCalledWith(card, contentElement.id);
		});
	});
});
