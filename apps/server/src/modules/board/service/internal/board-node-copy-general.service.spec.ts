import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { StorageLocation } from '@modules/files-storage/interface';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ToolConfig } from '@modules/tool/tool-config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import {
	cardFactory,
	collaborativeTextEditorFactory,
	columnBoardFactory,
	columnFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '../../testing';
import { BoardNodeCopyContext, BoardNodeCopyContextProps } from './board-node-copy-context';
import { BoardNodeCopyService } from './board-node-copy.service';

describe(BoardNodeCopyService.name, () => {
	let module: TestingModule;
	let service: BoardNodeCopyService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeCopyService,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ToolConfig, true>>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeCopyService);

		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const contextProps: BoardNodeCopyContextProps = {
			sourceStorageLocationId: new ObjectId().toHexString(),
			sourceStorageLocation: StorageLocation.SCHOOL,
			targetStorageLocationId: new ObjectId().toHexString(),
			targetStorageLocation: StorageLocation.SCHOOL,
			userId: new ObjectId().toHexString(),
			filesStorageClientAdapterService: createMock<FilesStorageClientAdapterService>(),
		};

		const copyContext = new BoardNodeCopyContext(contextProps);

		const mockStatus: CopyStatus = {
			status: CopyStatusEnum.SUCCESS,
			type: CopyElementType.BOARD,
		};

		jest.spyOn(service, 'copyColumnBoard').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyColumn').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyCard').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyFileElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyLinkElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyRichTextElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyDrawingElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copySubmissionContainerElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copySubmissionItem').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyExternalToolElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyCollaborativeTextEditorElement').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyMediaBoard').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyMediaLine').mockResolvedValue(mockStatus);
		jest.spyOn(service, 'copyMediaExternalToolElement').mockResolvedValue(mockStatus);

		return { copyContext, mockStatus };
	};

	describe('copy', () => {
		describe('when called with column board', () => {
			it('should copy column board', async () => {
				const { copyContext, mockStatus } = setup();
				const node = columnBoardFactory.build();

				const result = await service.copy(node, copyContext);

				expect(service.copyColumnBoard).toHaveBeenCalledWith(node, copyContext);
				expect(result).toEqual(mockStatus);
			});
		});

		describe('when called with column', () => {
			it('should copy column', async () => {
				const { copyContext, mockStatus } = setup();
				const node = columnFactory.build();

				const result = await service.copy(node, copyContext);

				expect(service.copyColumn).toHaveBeenCalledWith(node, copyContext);
				expect(result).toEqual(mockStatus);
			});
		});

		describe('when called with card', () => {
			it('should copy card', async () => {
				const { copyContext, mockStatus } = setup();
				const node = cardFactory.build();

				const result = await service.copy(node, copyContext);

				expect(service.copyCard).toHaveBeenCalledWith(node, copyContext);
				expect(result).toEqual(mockStatus);
			});
		});

		describe('when called with file element', () => {
			it('should copy file element', async () => {
				const { copyContext, mockStatus } = setup();
				const node = fileElementFactory.build();

				const result = await service.copy(node, copyContext);

				expect(service.copyFileElement).toHaveBeenCalledWith(node, copyContext);
				expect(result).toEqual(mockStatus);
			});

			describe('when called with link element', () => {
				it('should copy link element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = linkElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyLinkElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with rich text element', () => {
				it('should copy rich text element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = richTextElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyRichTextElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with drawing element', () => {
				it('should copy drawing element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = drawingElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyDrawingElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with submission container element', () => {
				it('should copy submission container element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = submissionContainerElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copySubmissionContainerElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with submission item', () => {
				it('should copy submission item', async () => {
					const { copyContext, mockStatus } = setup();
					const node = submissionItemFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copySubmissionItem).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with external tool element', () => {
				it('should copy external tool element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = externalToolElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyExternalToolElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with collaborative text editor element', () => {
				it('should copy collaborative text editor element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = collaborativeTextEditorFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyCollaborativeTextEditorElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with media board', () => {
				it('should copy collaborative media board', async () => {
					const { copyContext, mockStatus } = setup();
					const node = mediaBoardFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyMediaBoard).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with media line', () => {
				it('should copy collaborative media line', async () => {
					const { copyContext, mockStatus } = setup();
					const node = mediaLineFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyMediaLine).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});

			describe('when called with media external tool element', () => {
				it('should copy collaborative media external tool element', async () => {
					const { copyContext, mockStatus } = setup();
					const node = mediaExternalToolElementFactory.build();

					const result = await service.copy(node, copyContext);

					expect(service.copyMediaExternalToolElement).toHaveBeenCalledWith(node, copyContext);
					expect(result).toEqual(mockStatus);
				});
			});
		});
	});
});
