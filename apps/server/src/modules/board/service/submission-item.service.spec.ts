import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationError } from '@shared/common';
import { SubmissionItem } from '@shared/domain/domainobject';
import { richTextElementFactory, setupEntities, userFactory } from '@shared/testing/factory';
import {
	cardFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing/factory/domainobject';
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

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('create', () => {
		describe('when calling the create method', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submissionContainer = submissionContainerElementFactory.build();

				return { submissionContainer, user };
			};

			it('should return an instance of SubmissionItem', async () => {
				const { submissionContainer, user } = setup();
				const result = await service.create(user.id, submissionContainer, { completed: true });
				expect(result).toBeInstanceOf(SubmissionItem);
			});
		});
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

	describe('update', () => {
		const setup = () => {
			const submissionContainer = submissionContainerElementFactory.build();
			const submissionItem = submissionItemFactory.build();

			boardDoRepo.findParentOfId.mockResolvedValueOnce(submissionContainer);

			return { submissionContainer, submissionItem };
		};

		it('should fetch the parent', async () => {
			const { submissionItem } = setup();

			await service.update(submissionItem, true);

			expect(boardDoRepo.findParentOfId).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should throw if parent is not SubmissionContainerElement', async () => {
			const submissionItem = submissionItemFactory.build();
			const richTextElement = richTextElementFactory.build();
			boardDoRepo.findParentOfId.mockResolvedValueOnce(richTextElement);

			await expect(service.update(submissionItem, true)).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call bord repo to save submission item', async () => {
			const { submissionItem, submissionContainer } = setup();

			await service.update(submissionItem, true);

			expect(boardDoRepo.save).toHaveBeenCalledWith(submissionItem, submissionContainer);
		});

		it('should save completion', async () => {
			const { submissionItem, submissionContainer } = setup();

			await service.update(submissionItem, false);

			expect(boardDoRepo.save).toHaveBeenCalledWith(expect.objectContaining({ completed: false }), submissionContainer);
		});

		it('should throw if parent SubmissionContainer dueDate is in the past', async () => {
			const { submissionItem, submissionContainer } = setup();

			const yesterday = new Date(Date.now() - 86400000);
			submissionContainer.dueDate = yesterday;
			boardDoRepo.findParentOfId.mockResolvedValue(submissionContainer);

			await expect(service.update(submissionItem, true)).rejects.toThrowError(ValidationError);
		});
	});

	describe('delete', () => {
		const setup = () => {
			const submissionContainer = submissionContainerElementFactory.build();
			const submissionItem = submissionItemFactory.build();

			boardDoRepo.findParentOfId.mockResolvedValueOnce(submissionContainer);

			return { submissionContainer, submissionItem };
		};

		it('should fetch the parent', async () => {
			const { submissionItem } = setup();

			await service.delete(submissionItem);

			expect(boardDoRepo.findParentOfId).toHaveBeenCalledWith(submissionItem.id);
		});

		it('should throw if parent is not SubmissionContainerElement', async () => {
			const submissionItem = submissionItemFactory.build();
			const richTextElement = richTextElementFactory.build();
			boardDoRepo.findParentOfId.mockResolvedValueOnce(richTextElement);

			await expect(service.update(submissionItem, true)).rejects.toThrow(UnprocessableEntityException);
		});

		it('should call bord repo to delete submission item', async () => {
			const { submissionItem } = setup();

			await service.delete(submissionItem);

			expect(boardDoRepo.delete).toHaveBeenCalledWith(submissionItem);
		});

		it('should throw if parent SubmissionContainer dueDate is in the past', async () => {
			const { submissionItem, submissionContainer } = setup();

			const yesterday = new Date(Date.now() - 86400000);
			submissionContainer.dueDate = yesterday;
			boardDoRepo.findParentOfId.mockResolvedValue(submissionContainer);

			await expect(service.delete(submissionItem)).rejects.toThrowError(ValidationError);
		});
	});
});
