import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory } from '@shared/testing/factory/domainobject';
import { LegacyLogger } from '@src/core/logger';
import { CardService } from '../service/card.service';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let cardService: DeepMocked<CardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
				{
					provide: CardService,
					useValue: createMock<CardService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		cardService = module.get(CardService);
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

		it('should call the card repository', async () => {
			const { user, cardIds } = setup();

			await uc.findCards(user.id, cardIds);

			expect(cardService.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the domain objects from the card repository', async () => {
			const { user, cards, cardIds } = setup();
			cardService.findByIds.mockResolvedValueOnce(cards);

			const result = await uc.findCards(user.id, cardIds);

			expect(result).toEqual(cards);
		});
	});
});
