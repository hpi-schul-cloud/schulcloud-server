import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionItem } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { cardFactory, submissionItemFactory } from '@shared/testing/factory/domainobject';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';
import { SubmissionItemService } from './submission-item.service';

describe(SubmissionItemService.name, () => {
	let module: TestingModule;
	let service: SubmissionItemService;
	let boardDoRepo: DeepMocked<BoardDoRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SubmissionItemService,
				{
					provide: BoardDoRepo,
					useValue: createMock<BoardDoRepo>(),
				},
				{
					provide: BoardDoService,
					useValue: createMock<BoardDoRepo>(),
				},
			],
		}).compile();

		service = module.get(SubmissionItemService);
		boardDoRepo = module.get(BoardDoRepo);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		describe('when trying get SubmissionItem by id', () => {
			const setup = () => {
				const submissionItem = submissionItemFactory.build();
				boardDoRepo.findById.mockResolvedValue(submissionItem);

				return { submissionItem };
			};

			it('should return instance of SubmissionItem', async () => {
				const { submissionItem } = setup();

				const result = await service.findById(submissionItem.id);

				expect(result).toBeInstanceOf(SubmissionItem);
			});
		});

		describe('when trying get an wrong element by id', () => {
			const setup = () => {
				const cardElement = cardFactory.build();
				boardDoRepo.findById.mockResolvedValue(cardElement);

				return { cardElement };
			};

			it('should throw NotFoundException', async () => {
				const { cardElement } = setup();

				await expect(service.findById(cardElement.id)).rejects.toThrowError(NotFoundException);
			});
		});
	});
});
