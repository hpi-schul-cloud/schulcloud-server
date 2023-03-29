import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { cardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoRepo } from '../repo';
import { ContentElementService } from './content-element.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ContentElementService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('creating a content element', () => {
		const setup = () => {
			const card = cardFactory.build();
			const cardId = card.id;

			return { card, cardId };
		};

		it('should save a list of content elements using the repo', async () => {
			const { card, cardId } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(card);

			await service.create(cardId);

			expect(boardDoRepo.save).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						id: expect.any(String),
						text: '',
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				],
				cardId
			);
		});
	});
});
