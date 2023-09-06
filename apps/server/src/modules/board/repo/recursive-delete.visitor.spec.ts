import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import {
	columnBoardFactory,
	columnFactory,
	drawingElementFactory,
	fileElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { RecursiveDeleteVisitor } from './recursive-delete.vistor';

describe(RecursiveDeleteVisitor.name, () => {
	let module: TestingModule;
	let em: DeepMocked<EntityManager>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let service: RecursiveDeleteVisitor;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RecursiveDeleteVisitor,
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: FilesStorageClientAdapterService, useValue: createMock<FilesStorageClientAdapterService>() },
			],
		}).compile();

		em = module.get(EntityManager);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		service = module.get(RecursiveDeleteVisitor);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('when used as a visitor on a board composite', () => {
		describe('acceptAsync', () => {
			it('should delete the board node', async () => {
				const board = columnBoardFactory.build();

				await board.acceptAsync(service);

				expect(em.remove).toHaveBeenCalled();
			});

			it('should make the children accept the service', async () => {
				const columns = columnFactory.buildList(2).map((col) => {
					col.acceptAsync = jest.fn();
					return col;
				});
				const board = columnBoardFactory.build({ children: columns });

				await board.acceptAsync(service);

				expect(columns[0].acceptAsync).toHaveBeenCalledWith(service);
				expect(columns[1].acceptAsync).toHaveBeenCalledWith(service);
			});
		});
	});

	describe('visitFileElementAsync', () => {
		describe('WHEN file element, child and files are deleted successfully', () => {
			const setup = () => {
				const childFileElement = fileElementFactory.build();
				const fileElement = fileElementFactory.build({ children: [childFileElement] });

				return { fileElement, childFileElement };
			};

			it('should call deleteFilesOfParent', async () => {
				const { fileElement, childFileElement } = setup();

				await service.visitFileElementAsync(fileElement);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(fileElement.id);
				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(childFileElement.id);
			});

			it('should call deleteNode', async () => {
				const { fileElement, childFileElement } = setup();

				await service.visitFileElementAsync(fileElement);

				expect(em.remove).toHaveBeenCalledWith(em.getReference(fileElement.constructor, fileElement.id));
				expect(em.remove).toHaveBeenCalledWith(em.getReference(childFileElement.constructor, childFileElement.id));
			});
		});

		describe('WHEN deleteFilesOfParent of file element returns an error', () => {
			const setup = () => {
				const fileElement = fileElementFactory.build();
				const error = new Error('testError');
				filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { fileElement, error };
			};

			it('should pass error', async () => {
				const { fileElement, error } = setup();

				await expect(service.visitFileElementAsync(fileElement)).rejects.toThrowError(error);
			});

			it('should not call deleteNode', async () => {
				const { fileElement, error } = setup();

				await expect(service.visitFileElementAsync(fileElement)).rejects.toThrowError(error);
				expect(em.remove).not.toHaveBeenCalled();
			});
		});

		describe('WHEN deleteFilesOfParent of child file element returns an error', () => {
			const setup = () => {
				const childFileElement = fileElementFactory.build();
				const fileElement = fileElementFactory.build({ children: [childFileElement] });
				const error = new Error('testError');
				const fileDto = new FileDto({
					id: 'testId',
					name: 'testName',
					parentType: FileRecordParentType.BoardNode,
					parentId: 'testParentId',
				});

				filesStorageClientAdapterService.deleteFilesOfParent.mockResolvedValueOnce([fileDto]);
				filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

				return { fileElement, childFileElement, error };
			};

			it('should pass error', async () => {
				const { fileElement, error } = setup();

				await expect(service.visitFileElementAsync(fileElement)).rejects.toThrowError(error);
			});
		});
	});

	describe('visitDrawingElementAsync', () => {
		const setup = () => {
			const childDrawingElement = drawingElementFactory.build();

			return { childDrawingElement };
		};

		it('should call entity remove', async () => {
			const { childDrawingElement } = setup();

			await service.visitDrawingElementAsync(childDrawingElement);

			expect(em.remove).toHaveBeenCalledWith(em.getReference(childDrawingElement.constructor, childDrawingElement.id));
		});
	});

	describe('visitSubmissionContainerElementAsync', () => {
		const setup = () => {
			const childSubmissionContainerElement = submissionContainerElementFactory.build();
			const submissionContainerElement = submissionContainerElementFactory.build({
				children: [childSubmissionContainerElement],
			});

			return { submissionContainerElement, childSubmissionContainerElement };
		};

		it('should call entity remove', async () => {
			const { submissionContainerElement, childSubmissionContainerElement } = setup();

			await service.visitSubmissionContainerElementAsync(submissionContainerElement);

			expect(em.remove).toHaveBeenCalledWith(
				em.getReference(submissionContainerElement.constructor, submissionContainerElement.id)
			);
			expect(em.remove).toHaveBeenCalledWith(
				em.getReference(childSubmissionContainerElement.constructor, childSubmissionContainerElement.id)
			);
		});
	});

	describe('visitSubmissionItemAsync', () => {
		const setup = () => {
			const childSubmissionItem = submissionItemFactory.build();
			const submissionItem = submissionItemFactory.build({
				children: [childSubmissionItem],
			});

			return { submissionItem, childSubmissionItem };
		};

		it('should call entity remove', async () => {
			const { submissionItem, childSubmissionItem } = setup();

			await service.visitSubmissionItemAsync(submissionItem);

			expect(em.remove).toHaveBeenCalledWith(em.getReference(submissionItem.constructor, submissionItem.id));
			expect(em.remove).toHaveBeenCalledWith(em.getReference(childSubmissionItem.constructor, childSubmissionItem.id));
		});
	});
});
