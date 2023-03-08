import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
import { cardFactory } from '@shared/testing/factory/domainobject/card.do.factory';
import { Logger } from '@src/core/logger';
import { BoardNodeRepo, CardRepo } from '../repo';
import { CardUc } from './card.uc';

describe(CardUc.name, () => {
	let module: TestingModule;
	let uc: CardUc;
	let cardRepo: DeepMocked<CardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardUc,
				{
					provide: CardRepo,
					useValue: createMock<CardRepo>(),
				},
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		uc = module.get(CardUc);
		cardRepo = module.get(CardRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		// jest.resetAllMocks();
		// jest.clearAllMocks();
	});

	const setup = () => {
		const user = userFactory.buildWithId();
		const cards = cardFactory.buildList(3);
		const cardIds = cards.map((c) => c.id);

		return { user, cards, cardIds };
	};

	describe('finding many cards', () => {
		it('should call the card repository', async () => {
			const { user, cardIds } = setup();

			await uc.findCards(user.id, cardIds);

			expect(cardRepo.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the domain objects from the card repository', async () => {
			const { user, cards, cardIds } = setup();
			cardRepo.findByIds.mockResolvedValueOnce(cards);

			const result = await uc.findCards(user.id, cardIds);

			expect(result).toEqual(cards);
		});
	});
});
