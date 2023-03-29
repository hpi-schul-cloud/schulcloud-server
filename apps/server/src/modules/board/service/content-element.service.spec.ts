import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TextElement } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, textElementFactory } from '@shared/testing/factory/domainobject';
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

	describe('create', () => {
		describe('when creating a content element', () => {
			const setup = () => {
				const card = cardFactory.build();
				const cardId = card.id;

				return { card, cardId };
			};

			it('should save a list of content elements using the boardDo repo', async () => {
				const { card, cardId } = setup();

				boardDoRepo.findByClassAndId.mockResolvedValueOnce(card);

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

	describe('deleteById', () => {
		describe('when deleting a content element by id', () => {
			const setup = () => {
				const textElement = textElementFactory.build();
				const textElementId = textElement.id;

				return { textElement, textElementId };
			};

			it('should call deleteByClassAndId using the boardDo repo', async () => {
				const { textElementId } = setup();

				await service.deleteById(textElementId);

				expect(boardDoRepo.deleteByClassAndId).toHaveBeenCalledWith(TextElement, textElementId);
			});
		});
	});
});
