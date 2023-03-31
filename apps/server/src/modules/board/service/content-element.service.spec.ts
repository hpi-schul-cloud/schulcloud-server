import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { cardFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentElementService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
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
		boardDoService = module.get(BoardDoService);
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

				await service.create(card);

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

	describe('delete', () => {
		describe('when deleting a content element', () => {
			const setup = () => {
				const card = cardFactory.build();
				const textElement = textElementFactory.build();
				const textElementId = textElement.id;

				return { card, textElement, textElementId };
			};

			it('should call deleteChildWithDescendants using the boardDo service', async () => {
				const { card, textElementId } = setup();

				await service.delete(card, textElementId);

				expect(boardDoService.deleteChildWithDescendants).toHaveBeenCalledWith(card, textElementId);
			});
		});
	});

	describe('move', () => {
		describe('when moving a textElement', () => {
			it('should call do service', async () => {
				const targetParent = cardFactory.build();
				const element = textElementFactory.build();

				await service.move(element.id, targetParent.id, 3);

				expect(boardDoService.moveBoardDo).toHaveBeenCalledWith(element.id, targetParent.id, 3);
			});
		});
	});
});
