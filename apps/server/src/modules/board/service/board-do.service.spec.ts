import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Card } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, textElementFactory } from '@shared/testing/factory/domainobject';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

describe(BoardDoService.name, () => {
	let module: TestingModule;
	let service: BoardDoService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoService,
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

		service = module.get(BoardDoService);
		boardDoRepo = module.get(BoardDoRepo);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when searching a domain object by id', () => {
		const setup = () => {
			const elements = textElementFactory.buildListWithId(3);
			const card = cardFactory.build({ children: elements });
			const cardId = card.id;

			return { card, elements, cardId };
		};

		it('should return the domain object', async () => {
			const { card } = setup();
			boardDoRepo.findById.mockResolvedValueOnce(card);

			const found = await service.findById(card.id);

			expect(found).toBe(card);
		});
	});

	describe('when searching a domain object by class and id', () => {
		it('should delegate to the repo', async () => {
			const card = cardFactory.build();

			await service.findByClassAndId(Card, card.id);

			expect(boardDoRepo.findByClassAndId).toHaveBeenCalledWith(Card, card.id);
		});
	});

	describe('when deleting a child', () => {
		const setup = () => {
			const elements = textElementFactory.buildListWithId(3);
			const card = cardFactory.build({ children: elements });
			const cardId = card.id;

			return { card, elements, cardId };
		};

		it('should delete the child do', async () => {
			const { card, elements } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(card);

			await service.deleteChildWithDescendants(card, elements[0].id);

			expect(boardDoRepo.save).toHaveBeenCalledWith(card.children, card.id);
			expect(boardDoRepo.deleteWithDescendants).toHaveBeenCalledWith(elements[0].id);
		});

		it('should update the siblings', async () => {
			const { card, elements } = setup();

			boardDoRepo.findById.mockResolvedValueOnce(card);

			await service.deleteChildWithDescendants(card, elements[0].id);

			expect(boardDoRepo.save).toHaveBeenCalledWith([elements[1], elements[2]], card.id);
		});

		it('should throw if the child does not exist', async () => {
			const textElement = textElementFactory.buildWithId();
			const fakeId = new ObjectId().toHexString();

			await expect(service.deleteChildWithDescendants(textElement, fakeId)).rejects.toThrow();
		});
	});
});
