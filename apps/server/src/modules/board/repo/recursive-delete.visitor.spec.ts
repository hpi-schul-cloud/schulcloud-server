import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType } from '@infra/rabbitmq';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { Test, TestingModule } from '@nestjs/testing';
import {
	columnBoardFactory,
	columnFactory,
	contextExternalToolFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { DrawingElementAdapterService } from '@modules/tldraw-client';
import { RecursiveDeleteVisitor } from './recursive-delete.vistor';

describe(RecursiveDeleteVisitor.name, () => {
	let module: TestingModule;
	let service: RecursiveDeleteVisitor;

	let em: DeepMocked<EntityManager>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let drawingElementAdapterService: DeepMocked<DrawingElementAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RecursiveDeleteVisitor,
				{ provide: EntityManager, useValue: createMock<EntityManager>() },
				{ provide: FilesStorageClientAdapterService, useValue: createMock<FilesStorageClientAdapterService>() },
				{ provide: ContextExternalToolService, useValue: createMock<ContextExternalToolService>() },
				{ provide: DrawingElementAdapterService, useValue: createMock<DrawingElementAdapterService>() },
			],
		}).compile();

		service = module.get(RecursiveDeleteVisitor);
		em = module.get(EntityManager);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		contextExternalToolService = module.get(ContextExternalToolService);
		drawingElementAdapterService = module.get(DrawingElementAdapterService);

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

	describe('visitLinkElementAsync', () => {
		const setup = () => {
			const childLinkElement = linkElementFactory.build();
			const linkElement = linkElementFactory.build({
				children: [childLinkElement],
			});

			return { linkElement, childLinkElement };
		};

		it('should call entity remove', async () => {
			const { linkElement, childLinkElement } = setup();

			await service.visitLinkElementAsync(linkElement);

			expect(em.remove).toHaveBeenCalledWith(em.getReference(linkElement.constructor, linkElement.id));
			expect(em.remove).toHaveBeenCalledWith(em.getReference(childLinkElement.constructor, childLinkElement.id));
		});

		it('should call deleteFilesOfParent', async () => {
			const { linkElement } = setup();

			await service.visitLinkElementAsync(linkElement);

			expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(linkElement.id);
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

		it('should trigger deletion of tldraw data via adapter', async () => {
			const { childDrawingElement } = setup();

			await service.visitDrawingElementAsync(childDrawingElement);

			expect(drawingElementAdapterService.deleteDrawingBinData).toHaveBeenCalledWith(childDrawingElement.id);
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

	describe('visitExternalToolElementAsync', () => {
		describe('when the linked context external tool exists', () => {
			const setup = () => {
				const contextExternalTool = contextExternalToolFactory.buildWithId();
				const childExternalToolElement = externalToolElementFactory.build();
				const externalToolElement = externalToolElementFactory.build({
					children: [childExternalToolElement],
					contextExternalToolId: contextExternalTool.id,
				});

				contextExternalToolService.findById.mockResolvedValue(contextExternalTool);

				return {
					externalToolElement,
					childExternalToolElement,
					contextExternalTool,
				};
			};

			it('should delete the context external tool that is linked to the element', async () => {
				const { externalToolElement, contextExternalTool } = setup();

				await service.visitExternalToolElementAsync(externalToolElement);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});

			it('should call entity remove', async () => {
				const { externalToolElement, childExternalToolElement } = setup();

				await service.visitExternalToolElementAsync(externalToolElement);

				expect(em.remove).toHaveBeenCalledWith(
					em.getReference(externalToolElement.constructor, externalToolElement.id)
				);
				expect(em.remove).toHaveBeenCalledWith(
					em.getReference(childExternalToolElement.constructor, childExternalToolElement.id)
				);
			});
		});

		describe('when the external tool does not exist anymore', () => {
			const setup = () => {
				const childExternalToolElement = externalToolElementFactory.build();
				const externalToolElement = externalToolElementFactory.build({
					children: [childExternalToolElement],
					contextExternalToolId: new ObjectId().toHexString(),
				});

				contextExternalToolService.findById.mockResolvedValue(null);

				return {
					externalToolElement,
					childExternalToolElement,
				};
			};

			it('should not try to delete the context external tool that is linked to the element', async () => {
				const { externalToolElement } = setup();

				await service.visitExternalToolElementAsync(externalToolElement);

				expect(contextExternalToolService.deleteContextExternalTool).not.toHaveBeenCalled();
			});

			it('should call entity remove', async () => {
				const { externalToolElement, childExternalToolElement } = setup();

				await service.visitExternalToolElementAsync(externalToolElement);

				expect(em.remove).toHaveBeenCalledWith(
					em.getReference(externalToolElement.constructor, externalToolElement.id)
				);
				expect(em.remove).toHaveBeenCalledWith(
					em.getReference(childExternalToolElement.constructor, childExternalToolElement.id)
				);
			});
		});
	});
});
