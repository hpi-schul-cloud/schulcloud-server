import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Card, ColumnBoard } from '../domain';
import { BoardNodeRepo } from '../repo';
import {
	cardFactory,
	columnBoardFactory,
	deletedElementFactory,
	externalToolElementFactory,
	richTextElementFactory,
} from '../testing';
import { BoardNodeService } from './board-node.service';
import { BoardNodeDeleteHooksService, ContentElementUpdateService } from './internal';

describe(BoardNodeService.name, () => {
	let module: TestingModule;
	let service: BoardNodeService;

	let boardNodeRepo: DeepMocked<BoardNodeRepo>;
	// let contentElementUpdateService: DeepMocked<ContentElementUpdateService>;
	// let boardNodeDeleteHooksService: DeepMocked<BoardNodeDeleteHooksService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeService,
				{
					provide: BoardNodeRepo,
					useValue: createMock<BoardNodeRepo>(),
				},
				{
					provide: ContentElementUpdateService,
					useValue: createMock<ContentElementUpdateService>(),
				},
				{
					provide: BoardNodeDeleteHooksService,
					useValue: createMock<BoardNodeDeleteHooksService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeService);
		boardNodeRepo = module.get(BoardNodeRepo);
		// contentElementUpdateService = module.get(ContentElementUpdateService);
		// boardNodeDeleteHooksService = module.get(BoardNodeDeleteHooksService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findById', () => {
		const setup = () => {
			const boardNode = columnBoardFactory.build();
			boardNodeRepo.findById.mockResolvedValueOnce(boardNode);

			return { boardNode };
		};

		it('should use the repo', async () => {
			const { boardNode } = setup();

			await service.findById(boardNode.id, 2);

			expect(boardNodeRepo.findById).toHaveBeenCalledWith(boardNode.id, 2);
		});

		it('should return the repo result', async () => {
			const { boardNode } = setup();

			const result = await service.findById(boardNode.id, 2);

			expect(result).toBe(boardNode);
		});
	});

	describe('findByClassAndId', () => {
		const setup = () => {
			const boardNode = columnBoardFactory.build();
			boardNodeRepo.findById.mockResolvedValueOnce(boardNode);

			return { boardNode };
		};

		it('should use the repo', async () => {
			const { boardNode } = setup();

			await service.findByClassAndId(ColumnBoard, boardNode.id);

			expect(boardNodeRepo.findById).toHaveBeenCalledWith(boardNode.id, undefined);
		});

		it('should return the repo result', async () => {
			const { boardNode } = setup();

			const result = await service.findByClassAndId(ColumnBoard, boardNode.id);

			expect(result).toBe(boardNode);
		});

		describe('when class doesnt match', () => {
			it('should throw error', async () => {
				const { boardNode } = setup();

				await expect(service.findByClassAndId(Card, boardNode.id)).rejects.toThrowError();
			});
		});
	});

	describe('findContentElementById', () => {
		const setup = () => {
			const element = richTextElementFactory.build();
			boardNodeRepo.findById.mockResolvedValueOnce(element);

			return { element };
		};

		it('should use the repo', async () => {
			const { element } = setup();

			await service.findContentElementById(element.id);

			expect(boardNodeRepo.findById).toHaveBeenCalledWith(element.id, undefined);
		});

		it('should return the repo result', async () => {
			const { element } = setup();

			const result = await service.findContentElementById(element.id);

			expect(result).toBe(element);
		});

		describe('when node is not a content element', () => {
			const setupNoneElement = () => {
				const boardNode = columnBoardFactory.build();
				boardNodeRepo.findById.mockResolvedValueOnce(boardNode);

				return { boardNode };
			};

			it('should throw error', async () => {
				const { boardNode } = setupNoneElement();

				await expect(service.findContentElementById(boardNode.id)).rejects.toThrowError();
			});
		});
	});

	describe('replace', () => {
		describe('when replacing a node', () => {
			const setup = () => {
				const oldNode = externalToolElementFactory.build();
				const newNode = deletedElementFactory.build();
				const parentNode = cardFactory.build();
				parentNode.addChild(oldNode);

				boardNodeRepo.findById.mockResolvedValueOnce(new Card({ ...parentNode.getTrueProps() }));

				return {
					parentNode,
					oldNode,
					newNode,
				};
			};

			it('should add the new node', async () => {
				const { parentNode, oldNode, newNode } = setup();

				await service.replace(oldNode, newNode);

				expect(boardNodeRepo.save).toHaveBeenCalledWith(
					new Card({ ...parentNode.getTrueProps(), children: [oldNode, newNode] })
				);
			});

			it('should delete the old node', async () => {
				const { oldNode, newNode } = setup();

				await service.replace(oldNode, newNode);

				expect(boardNodeRepo.delete).toHaveBeenCalledWith(oldNode);
			});
		});

		describe('when the node has no parent', () => {
			const setup = () => {
				const oldNode = externalToolElementFactory.build();
				const newNode = deletedElementFactory.build();

				return {
					oldNode,
					newNode,
				};
			};

			it('should throw an error', async () => {
				const { oldNode, newNode } = setup();

				await expect(service.replace(oldNode, newNode)).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('findElementsByContextExternalToolId', () => {
		describe('when finding a node by its ', () => {
			const setup = () => {
				const contextExternalToolId = new ObjectId().toHexString();
				const node = externalToolElementFactory.build({
					contextExternalToolId,
				});

				boardNodeRepo.findByContextExternalToolIds.mockResolvedValueOnce([node]);

				return {
					node,
					contextExternalToolId,
				};
			};

			it('should search by the context external tool id', async () => {
				const { contextExternalToolId } = setup();

				await service.findElementsByContextExternalToolId(contextExternalToolId);

				expect(boardNodeRepo.findByContextExternalToolIds).toHaveBeenCalledWith([contextExternalToolId]);
			});

			it('should return the node', async () => {
				const { node, contextExternalToolId } = setup();

				const result = await service.findElementsByContextExternalToolId(contextExternalToolId);

				expect(result).toEqual([node]);
			});
		});
	});
});
