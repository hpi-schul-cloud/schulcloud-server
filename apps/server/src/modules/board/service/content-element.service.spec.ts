import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { cardFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { CardRepo, ContentElementRepo } from '../repo';
import { ContentElementService } from './content-element.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let contentElementRepo: DeepMocked<ContentElementRepo>;
	let cardRepo: DeepMocked<CardRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementService,
				{
					provide: ContentElementRepo,
					useValue: createMock<ContentElementRepo>(),
				},
				{
					provide: CardRepo,
					useValue: createMock<CardRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		service = module.get(ContentElementService);
		contentElementRepo = module.get(ContentElementRepo);
		cardRepo = module.get(CardRepo);
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

			cardRepo.findById.mockResolvedValueOnce(card);

			await service.createElement(cardId);

			expect(contentElementRepo.save).toHaveBeenCalledWith(
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
