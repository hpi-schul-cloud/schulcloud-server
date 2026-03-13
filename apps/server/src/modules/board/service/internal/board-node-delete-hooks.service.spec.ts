import { DomainErrorHandler } from '@core/error';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { H5pEditorProducer } from '@infra/h5p-editor-client';
import { TldrawClientAdapter } from '@infra/tldraw-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { CollaborativeTextEditorService } from '@modules/collaborative-text-editor';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import {
	collaborativeTextEditorFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	fileFolderElementFactory,
	h5pElementFactory,
	linkElementFactory,
} from '../../testing';
import { BoardNodeDeleteHooksService } from './board-node-delete-hooks.service';

describe(BoardNodeDeleteHooksService.name, () => {
	let module: TestingModule;
	let service: BoardNodeDeleteHooksService;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let drawingElementAdapterService: DeepMocked<TldrawClientAdapter>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let collaborativeTextEditorService: DeepMocked<CollaborativeTextEditorService>;
	let h5pEditorProducer: DeepMocked<H5pEditorProducer>;
	let domainErrorHandler: DeepMocked<DomainErrorHandler>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeDeleteHooksService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: TldrawClientAdapter,
					useValue: createMock<TldrawClientAdapter>(),
				},
				{
					provide: CollaborativeTextEditorService,
					useValue: createMock<CollaborativeTextEditorService>(),
				},
				{
					provide: H5pEditorProducer,
					useValue: createMock<H5pEditorProducer>(),
				},
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeDeleteHooksService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		drawingElementAdapterService = module.get(TldrawClientAdapter);
		contextExternalToolService = module.get(ContextExternalToolService);
		collaborativeTextEditorService = module.get(CollaborativeTextEditorService);
		h5pEditorProducer = module.get(H5pEditorProducer);
		domainErrorHandler = module.get(DomainErrorHandler);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('afterDelete', () => {
		describe('when called with file element', () => {
			describe('when deleteFilesOfParent resolves', () => {
				const setup = () => {
					return { boardNode: fileElementFactory.build() };
				};

				it('should delete files', async () => {
					const { boardNode } = setup();

					await service.afterDelete(boardNode);

					expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
				});
			});

			describe('when deleteFilesOfParent rejects', () => {
				const setup = () => {
					const boardNode = fileElementFactory.build();
					const error = new Error('delete error');
					filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

					return { boardNode, error };
				};

				it('should catch the error and call DomainErrorHandler', async () => {
					const { boardNode, error } = setup();

					await service.afterDelete(boardNode);

					expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
					expect(domainErrorHandler.exec).toHaveBeenCalledWith(error);
				});
			});
		});

		describe('when called with file folder element', () => {
			describe('when deleteFilesOfParent resolves', () => {
				const setup = () => {
					return { boardNode: fileFolderElementFactory.build() };
				};

				it('should delete files', async () => {
					const { boardNode } = setup();

					await service.afterDelete(boardNode);

					expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
				});
			});

			describe('when deleteFilesOfParent rejects', () => {
				const setup = () => {
					const boardNode = fileFolderElementFactory.build();
					const error = new Error('delete error');
					filesStorageClientAdapterService.deleteFilesOfParent.mockRejectedValueOnce(error);

					return { boardNode, error };
				};

				it('should catch the error and call DomainErrorHandler', async () => {
					const { boardNode, error } = setup();

					await service.afterDelete(boardNode);

					expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
					expect(domainErrorHandler.exec).toHaveBeenCalledWith(error);
				});
			});
		});

		describe('when called with link element', () => {
			const setup = () => {
				return { boardNode: linkElementFactory.build() };
			};

			it('should delete files', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
			});
		});

		describe('when called with drawing element', () => {
			const setup = () => {
				return { boardNode: drawingElementFactory.build() };
			};

			it('should delete drawing data', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(drawingElementAdapterService.deleteDrawingBinData).toHaveBeenCalledWith(boardNode.id);
			});

			it('should delete files', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
			});
		});

		describe('when called with external tool element', () => {
			const setup = () => {
				const tool = contextExternalToolFactory.build();
				contextExternalToolService.findById.mockResolvedValueOnce(tool);
				return { boardNode: externalToolElementFactory.build(), tool };
			};

			it('should delete linked tool', async () => {
				const { boardNode, tool } = setup();

				await service.afterDelete(boardNode);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(tool);
			});
		});

		describe('when called with collaborative text editor element', () => {
			const setup = () => {
				return { boardNode: collaborativeTextEditorFactory.build() };
			};

			it('should delete editor', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(collaborativeTextEditorService.deleteCollaborativeTextEditorByParentId).toHaveBeenCalledWith(
					boardNode.id
				);
			});
		});

		describe('when called with media external tool element', () => {
			const setup = () => {
				const tool = contextExternalToolFactory.build();
				contextExternalToolService.findById.mockResolvedValueOnce(tool);
				return { boardNode: externalToolElementFactory.build(), tool };
			};

			it('should delete linked tool', async () => {
				const { boardNode, tool } = setup();

				await service.afterDelete(boardNode);

				expect(contextExternalToolService.deleteContextExternalTool).toHaveBeenCalledWith(tool);
			});
		});

		describe('when called with h5p element', () => {
			const setup = () => {
				return {
					boardNode: h5pElementFactory.build({
						contentId: new ObjectId().toHexString(),
					}),
				};
			};

			it('should delete the linked content', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(h5pEditorProducer.deleteContent).toHaveBeenCalledWith({ contentId: boardNode.contentId });
			});
		});
	});
});
