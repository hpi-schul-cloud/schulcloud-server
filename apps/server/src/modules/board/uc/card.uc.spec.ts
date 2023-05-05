import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementType } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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

	describe('findCards', () => {
		describe('when finding many cards', () => {
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
	});

	describe('createElement', () => {
		describe('when creating a content element', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const card = cardFactory.build();
				const element = textElementFactory.build();

				cardService.findById.mockResolvedValueOnce(card);
				elementService.create.mockResolvedValueOnce(element);

				return { user, card, element };
			};

			it('should call the service to find the card', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.TEXT);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to create the content element', async () => {
				const { user, card } = setup();

				await uc.createElement(user.id, card.id, ContentElementType.TEXT);

				expect(elementService.create).toHaveBeenCalledWith(card, ContentElementType.TEXT);
			});

			it('should return new content element', async () => {
				const { user, card, element } = setup();

				const result = await uc.createElement(user.id, card.id, ContentElementType.TEXT);

				expect(result).toEqual(element);
			});
		});
	});

	describe('deleteElement', () => {
		describe('when deleting a content element', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = textElementFactory.build();
				const card = cardFactory.build();

				return { user, card, element };
			};

			it('should call the service to find the element', async () => {
				const { user, element } = setup();

				await uc.deleteElement(user.id, element.id);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to delete the element', async () => {
				const { user, element } = setup();
				elementService.findById.mockResolvedValueOnce(element);

				await uc.deleteElement(user.id, element.id);

				expect(elementService.delete).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('moveElement', () => {
		describe('when moving an element', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const element = textElementFactory.buildWithId();
				const card = cardFactory.build();

				return { user, card, element };
			};

			it('should call the service to find the element', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(elementService.findById).toHaveBeenCalledWith(element.id);
			});

			it('should call the service to find the target card', async () => {
				const { user, element, card } = setup();

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(cardService.findById).toHaveBeenCalledWith(card.id);
			});

			it('should call the service to move the element', async () => {
				const { user, element, card } = setup();
				elementService.findById.mockResolvedValueOnce(element);
				cardService.findById.mockResolvedValueOnce(card);

				await uc.moveElement(user.id, element.id, card.id, 3);

				expect(elementService.move).toHaveBeenCalledWith(element, card, 3);
			});
		});
	});
});
