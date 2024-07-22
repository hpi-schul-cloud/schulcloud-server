import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { CollaborativeTextEditorService } from '@src/modules/collaborative-text-editor';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { DrawingElementAdapterService } from '@src/modules/tldraw-client';
import { ContextExternalToolService } from '@src/modules/tool/context-external-tool';
import { contextExternalToolFactory } from '@src/modules/tool/context-external-tool/testing';
import {
	collaborativeTextEditorFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
} from '../../testing';
import { BoardNodeDeleteHooksService } from './board-node-delete-hooks.service';

describe(BoardNodeDeleteHooksService.name, () => {
	let module: TestingModule;
	let service: BoardNodeDeleteHooksService;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let drawingElementAdapterService: DeepMocked<DrawingElementAdapterService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let collaborativeTextEditorService: CollaborativeTextEditorService;

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
					provide: DrawingElementAdapterService,
					useValue: createMock<DrawingElementAdapterService>(),
				},
				{
					provide: CollaborativeTextEditorService,
					useValue: createMock<CollaborativeTextEditorService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeDeleteHooksService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		drawingElementAdapterService = module.get(DrawingElementAdapterService);
		contextExternalToolService = module.get(ContextExternalToolService);
		collaborativeTextEditorService = module.get(CollaborativeTextEditorService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('afterDelete', () => {
		describe('when called with file element', () => {
			const setup = () => {
				return { boardNode: fileElementFactory.build() };
			};

			it('should delete files', async () => {
				const { boardNode } = setup();

				await service.afterDelete(boardNode);

				expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(boardNode.id);
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
	});
});
