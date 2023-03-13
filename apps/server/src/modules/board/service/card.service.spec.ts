import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { cardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { CardRepo } from '../repo';
import { ColumnBoardService } from './column-board.service';
import { CardService } from './card.service';

describe(CardService.name, () => {
	let module: TestingModule;
	let service: CardService;
	let cardRepo: DeepMocked<CardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CardService,
				{
					provide: CardRepo,
					useValue: createMock<CardRepo>(),
				},
				{
					provide: ColumnBoardService,
					useValue: createMock<ColumnBoardService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(CardService);
		cardRepo = module.get(CardRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('finding many cards', () => {
		const setup = () => {
			const cards = cardFactory.buildList(3);
			const cardIds = cards.map((c) => c.id);

			return { cards, cardIds };
		};

		it('should call the card repository', async () => {
			const { cardIds } = setup();

			await service.findByIds(cardIds);

			expect(cardRepo.findByIds).toHaveBeenCalledWith(cardIds);
		});

		it('should return the domain objects from the card repository', async () => {
			const { cards, cardIds } = setup();
			cardRepo.findByIds.mockResolvedValueOnce(cards);

			const result = await service.findByIds(cardIds);

			expect(result).toEqual(cards);
		});
	});
});
