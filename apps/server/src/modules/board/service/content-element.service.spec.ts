import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ContentElementProvider } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, fileElementFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { BoardDoRepo } from '../repo';
import { ContentElementType } from '../types';
import { BoardDoService } from './board-do.service';
import { ContentElementService } from './content-element.service';

describe(ContentElementService.name, () => {
	let module: TestingModule;
	let service: ContentElementService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;
	let boardDoService: DeepMocked<BoardDoService>;
	let contentElementProvider: DeepMocked<ContentElementProvider>;

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
				{
					provide: ContentElementProvider,
					useValue: createMock<ContentElementProvider>(),
				},
			],
		}).compile();

		service = module.get(ContentElementService);
		boardDoRepo = module.get(BoardDoRepo);
		boardDoService = module.get(BoardDoService);
		contentElementProvider = module.get(ContentElementProvider);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('create', () => {
		describe('when creating a content element of type', () => {
			describe('TEXT', () => {
				const setup = () => {
					const card = cardFactory.build();
					const cardId = card.id;
					const textElement = textElementFactory.build();

					contentElementProvider.getElement.mockReturnValue(textElement);

					return { card, cardId, textElement };
				};

				it('should call getElement method of ContentElementProvider', async () => {
					const { card } = setup();

					await service.create(card, ContentElementType.TEXT);

					expect(contentElementProvider.getElement).toHaveBeenCalledWith(ContentElementType.TEXT);
				});

				it('should call save method of boardDo repo', async () => {
					const { card, textElement } = setup();

					await service.create(card, ContentElementType.TEXT);

					expect(boardDoRepo.save).toHaveBeenCalledWith([textElement], card);
				});
			});

			describe('FILE', () => {
				const setup = () => {
					const card = cardFactory.build();
					const cardId = card.id;
					const fileElement = fileElementFactory.build();

					contentElementProvider.getElement.mockReturnValue(fileElement);

					return { card, cardId, fileElement };
				};

				it('should call save method of boardDo repo', async () => {
					const { card, fileElement } = setup();

					await service.create(card, ContentElementType.FILE);

					expect(boardDoRepo.save).toHaveBeenCalledWith([fileElement], card);
				});
			});
		});
	});

	describe('delete', () => {
		describe('when deleting an element', () => {
			it('should call the service', async () => {
				const element = textElementFactory.build();

				await service.delete(element);

				expect(boardDoService.deleteWithDescendants).toHaveBeenCalledWith(element);
			});
		});
	});

	describe('move', () => {
		describe('when moving an element', () => {
			it('should call the service', async () => {
				const targetParent = cardFactory.build();
				const element = textElementFactory.build();

				await service.move(element, targetParent, 3);

				expect(boardDoService.move).toHaveBeenCalledWith(element, targetParent, 3);
			});
		});
	});
});
