import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { StorageLocation } from '@modules/files-storage/interface';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ToolConfig } from '@modules/tool/tool-config';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { contextExternalToolFactory } from '@src/modules/tool/context-external-tool/testing';
import {
	Card,
	CollaborativeTextEditorElement,
	Column,
	ColumnBoard,
	DeletedElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../../domain';
import {
	cardFactory,
	collaborativeTextEditorFactory,
	columnBoardFactory,
	columnFactory,
	deletedElementFactory,
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
import { BoardNodeCopyContext } from './board-node-copy-context';
import { BoardNodeCopyService } from './board-node-copy.service';

describe(BoardNodeCopyService.name, () => {
	let module: TestingModule;
	let service: BoardNodeCopyService;
	const config: ToolConfig = {
		FEATURE_CTL_TOOLS_TAB_ENABLED: false,
		FEATURE_LTI_TOOLS_TAB_ENABLED: false,
		CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES: 0,
		CTL_TOOLS_BACKEND_URL: '',
		FEATURE_CTL_TOOLS_COPY_ENABLED: false,
		CTL_TOOLS_RELOAD_TIME_MS: 0,
		FILES_STORAGE__SERVICE_BASE_URL: '',
	};
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeCopyService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn().mockImplementation((key: keyof ToolConfig) => config[key]),
					},
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
		contextExternalToolService = module.get(ContextExternalToolService);
		copyHelperService = module.get(CopyHelperService);

		await setupEntities();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setupContext = () => {
		const contextProps = {
			sourceStorageLocationId: new ObjectId().toHexString(),
			sourceStorageLocation: StorageLocation.SCHOOL,
			targetStorageLocationId: new ObjectId().toHexString(),
			targetStorageLocation: StorageLocation.SCHOOL,
			userId: new ObjectId().toHexString(),
			filesStorageClientAdapterService: createMock<FilesStorageClientAdapterService>(),
		};

		const copyContext = new BoardNodeCopyContext(contextProps);

		return { copyContext };
	};

	describe('copy column board', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const columnBoard = columnBoardFactory.build({ children: columnFactory.buildList(1) });

			return { copyContext, columnBoard };
		};

		it('should copy the node', async () => {
			const { copyContext, columnBoard } = setup();

			const result = await service.copyColumnBoard(columnBoard, copyContext);

			expect(result.copyEntity).toBeInstanceOf(ColumnBoard);
		});

		it('should copy the children', async () => {
			const { copyContext, columnBoard } = setup();

			const result = await service.copyColumnBoard(columnBoard, copyContext);

			expect((result.elements ?? [])[0].copyEntity).toBeInstanceOf(Column);
		});

		it('should use the service to derive status from children', async () => {
			const { copyContext, columnBoard } = setup();

			const result = await service.copyColumnBoard(columnBoard, copyContext);

			expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalledWith(result.elements);
		});
	});

	describe('copy column', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const column = columnFactory.build({ children: cardFactory.buildList(1) });

			return { copyContext, column };
		};

		it('should copy the node', async () => {
			const { copyContext, column } = setup();

			const result = await service.copyColumn(column, copyContext);

			expect(result.copyEntity).toBeInstanceOf(Column);
		});

		it('should copy the children', async () => {
			const { copyContext, column } = setup();

			const result = await service.copyColumn(column, copyContext);

			expect((result.elements ?? [])[0].copyEntity).toBeInstanceOf(Card);
		});
	});

	describe('copy card', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const card = cardFactory.build({ children: richTextElementFactory.buildList(1) });

			return { copyContext, card };
		};

		it('should copy the node', async () => {
			const { copyContext, card } = setup();

			const result = await service.copyCard(card, copyContext);

			expect(result.copyEntity).toBeInstanceOf(Card);
		});

		it('should copy the children', async () => {
			const { copyContext, card } = setup();

			const result = await service.copyCard(card, copyContext);

			expect((result.elements ?? [])[0].copyEntity).toBeInstanceOf(RichTextElement);
		});
	});

	describe('copy file element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const fileElement = fileElementFactory.build();
			const fileCopyStatus: CopyFileDto = {
				name: 'bird.jpg',
				id: new ObjectId().toHexString(),
				sourceId: new ObjectId().toHexString(),
			};
			jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

			return { copyContext, fileElement, fileCopyStatus };
		};

		it('should copy the node', async () => {
			const { copyContext, fileElement } = setup();

			const result = await service.copyFileElement(fileElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(FileElement);
		});

		it('should copy the files', async () => {
			const { copyContext, fileElement, fileCopyStatus } = setup();

			const result = await service.copyFileElement(fileElement, copyContext);

			expect(copyContext.copyFilesOfParent).toHaveBeenCalledWith(fileElement.id, result.copyEntity?.id);
			expect(result.elements ?? []).toEqual([expect.objectContaining({ title: fileCopyStatus.name })]);
		});
	});

	describe('copy link element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const sourceId = new ObjectId().toHexString();
			const linkElement = linkElementFactory.build({
				id: sourceId,
				imageUrl: `https://example.com/${sourceId}/bird.jpg`,
			});
			const linkElementWithoutId = linkElementFactory.build({
				id: sourceId,
				imageUrl: `https://example.com/plane.jpg`,
			});
			const fileCopyStatus: CopyFileDto = {
				name: 'bird.jpg',
				id: new ObjectId().toHexString(),
				sourceId,
			};
			jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

			return { copyContext, linkElement, linkElementWithoutId, fileCopyStatus };
		};

		it('should copy the node', async () => {
			const { copyContext, linkElement } = setup();

			const result = await service.copyLinkElement(linkElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(LinkElement);
		});

		it('should copy the files', async () => {
			const { copyContext, linkElement, fileCopyStatus } = setup();

			const result = await service.copyLinkElement(linkElement, copyContext);

			expect(copyContext.copyFilesOfParent).toHaveBeenCalledWith(linkElement.id, result.copyEntity?.id);
			expect(result.elements ?? []).toEqual([expect.objectContaining({ title: fileCopyStatus.name })]);
		});

		describe('when imageUrl includes source id', () => {
			it('should replace the source id in image url', async () => {
				const { copyContext, linkElement, fileCopyStatus } = setup();

				const result = await service.copyLinkElement(linkElement, copyContext);

				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				expect((result.copyEntity as LinkElement).imageUrl).toBe(`https://example.com/${fileCopyStatus.id}/bird.jpg`);
			});
		});

		describe('when imageUrl doesnt include source id', () => {
			it('should set blank image url', async () => {
				const { copyContext, linkElementWithoutId } = setup();

				const result = await service.copyLinkElement(linkElementWithoutId, copyContext);

				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				expect((result.copyEntity as LinkElement).imageUrl).toBe('');
			});
		});

		describe('when no imageUrl is present', () => {
			const setupWithoutImageUrl = () => {
				const { copyContext, fileCopyStatus } = setup();
				const linkElement = linkElementFactory.build({ imageUrl: undefined });

				return { copyContext, linkElement, fileCopyStatus };
			};
			it('should replace the source id in image urls', async () => {
				const { copyContext, linkElement } = setupWithoutImageUrl();

				const result = await service.copyLinkElement(linkElement, copyContext);

				expect((result.copyEntity as LinkElement).imageUrl).toBe('');
			});
		});
	});

	describe('copy rich text element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const richTextElement = richTextElementFactory.build();

			return { copyContext, richTextElement };
		};

		it('should copy the node', async () => {
			const { copyContext, richTextElement } = setup();

			const result = await service.copyRichTextElement(richTextElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(RichTextElement);
		});
	});

	describe('copy drawing element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const drawingElement = drawingElementFactory.build();

			return { copyContext, drawingElement };
		};

		it('should copy the node', async () => {
			const { copyContext, drawingElement } = setup();

			const result = await service.copyDrawingElement(drawingElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(DrawingElement);
		});
	});

	describe('copy submission container element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const submissionContainerElement = submissionContainerElementFactory.build({
				children: submissionItemFactory.buildList(1),
			});

			return { copyContext, submissionContainerElement };
		};

		it('should copy the node', async () => {
			const { copyContext, submissionContainerElement } = setup();

			const result = await service.copySubmissionContainerElement(submissionContainerElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(SubmissionContainerElement);
		});

		it('should copy the children', async () => {
			const { copyContext, submissionContainerElement } = setup();

			const result = await service.copySubmissionContainerElement(submissionContainerElement, copyContext);

			const expectedChildStatus: CopyStatus = {
				type: CopyElementType.SUBMISSION_ITEM,
				status: CopyStatusEnum.NOT_DOING,
			};
			expect((result.elements ?? [])[0]).toEqual(expectedChildStatus);
		});
	});

	describe('copy submission item', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const submissionItem = submissionItemFactory.build();

			return { copyContext, submissionItem };
		};

		it('should copy the node', async () => {
			const { copyContext, submissionItem } = setup();

			const result = await service.copySubmissionItem(submissionItem, copyContext);

			const expectedChildStatus: CopyStatus = {
				type: CopyElementType.SUBMISSION_ITEM,
				status: CopyStatusEnum.NOT_DOING,
			};
			expect(result).toEqual(expectedChildStatus);
		});
	});

	describe('copy external tool element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const externalToolElement = externalToolElementFactory.build({
				contextExternalToolId: new ObjectId().toHexString(),
			});

			return { copyContext, externalToolElement };
		};

		it('should copy the node', async () => {
			const { copyContext, externalToolElement } = setup();

			const result = await service.copyExternalToolElement(externalToolElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(ExternalToolElement);
		});

		describe('when ctl tools copy is enabled', () => {
			const setupCopyEnabled = () => {
				const { copyContext, externalToolElement } = setup();

				config.FEATURE_CTL_TOOLS_COPY_ENABLED = true;

				return { copyContext, externalToolElement };
			};

			describe('when linked external tool is found', () => {
				const setupToolElement = () => {
					const { copyContext, externalToolElement } = setupCopyEnabled();

					const tool = contextExternalToolFactory.build();
					const toolCopy = contextExternalToolFactory.build();
					contextExternalToolService.findById.mockResolvedValueOnce(tool);
					contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(toolCopy);
					externalToolElement.contextExternalToolId = tool.id;

					return { copyContext, externalToolElement, tool, toolCopy };
				};

				it('should copy the external tool', async () => {
					const { copyContext, externalToolElement, tool, toolCopy } = setupToolElement();

					const result = await service.copyExternalToolElement(externalToolElement, copyContext);

					expect(contextExternalToolService.findById).toHaveBeenCalledWith(tool.id);
					expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(tool, result.copyEntity?.id);
					expect((result.copyEntity as ExternalToolElement).contextExternalToolId).toEqual(toolCopy.id);
				});
			});

			describe('when linked external tool is not found', () => {
				const setupToolNotFound = () => {
					const { copyContext, externalToolElement } = setupCopyEnabled();

					contextExternalToolService.findById.mockResolvedValueOnce(null);

					return { copyContext, externalToolElement };
				};

				it('should return failure status', async () => {
					const { copyContext, externalToolElement } = setupToolNotFound();

					const result = await service.copyExternalToolElement(externalToolElement, copyContext);

					expect(result.status).toEqual(CopyStatusEnum.FAIL);
				});
			});

			describe('when no external tool is linked', () => {
				const setupNoExternalTool = () => {
					const { copyContext, externalToolElement } = setupCopyEnabled();

					externalToolElement.contextExternalToolId = undefined;

					return { copyContext, externalToolElement };
				};

				it('should return success status', async () => {
					const { copyContext, externalToolElement } = setupNoExternalTool();

					const result = await service.copyExternalToolElement(externalToolElement, copyContext);

					expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
				});
			});
		});

		describe('when ctl tools copy is disabled', () => {
			const setupCopyDisabled = () => {
				const { copyContext, externalToolElement } = setup();

				config.FEATURE_CTL_TOOLS_COPY_ENABLED = false;

				return { copyContext, externalToolElement };
			};

			it('should return success status', async () => {
				const { copyContext, externalToolElement } = setupCopyDisabled();

				const result = await service.copyExternalToolElement(externalToolElement, copyContext);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});
	});

	describe('copy collaborative text editor element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const collaborativeTextEditor = collaborativeTextEditorFactory.build();

			return { copyContext, collaborativeTextEditor };
		};

		it('should copy the node', async () => {
			const { copyContext, collaborativeTextEditor } = setup();

			const result = await service.copyCollaborativeTextEditorElement(collaborativeTextEditor, copyContext);

			expect(result.copyEntity).toBeInstanceOf(CollaborativeTextEditorElement);
		});

		it('should return the correct type and status', async () => {
			const { copyContext, collaborativeTextEditor } = setup();

			const result = await service.copyCollaborativeTextEditorElement(collaborativeTextEditor, copyContext);

			expect(result).toEqual(
				expect.objectContaining({
					type: CopyElementType.COLLABORATIVE_TEXT_EDITOR_ELEMENT,
					status: CopyStatusEnum.PARTIAL,
				})
			);
		});
	});

	describe('copy media board', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const mediaBoard = mediaBoardFactory.build({ children: mediaLineFactory.buildList(1) });

			return { copyContext, mediaBoard };
		};

		it('should return the correct type and status', async () => {
			const { copyContext, mediaBoard } = setup();

			const result = await service.copyMediaBoard(mediaBoard, copyContext);

			expect(result).toEqual(
				expect.objectContaining({
					type: CopyElementType.MEDIA_BOARD,
					status: CopyStatusEnum.NOT_DOING,
				})
			);
		});

		it('should copy the children', async () => {
			const { copyContext, mediaBoard } = setup();

			const result = await service.copyMediaBoard(mediaBoard, copyContext);

			expect(result.elements ?? []).toHaveLength(1);
		});
	});

	describe('copy media line', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const mediaLine = mediaLineFactory.build({ children: mediaExternalToolElementFactory.buildList(1) });

			return { copyContext, mediaLine };
		};

		it('should return the correct type and status', async () => {
			const { copyContext, mediaLine } = setup();

			const result = await service.copyMediaLine(mediaLine, copyContext);

			expect(result).toEqual(
				expect.objectContaining({
					type: CopyElementType.MEDIA_LINE,
					status: CopyStatusEnum.NOT_DOING,
				})
			);
		});

		it('should copy the children', async () => {
			const { copyContext, mediaLine } = setup();

			const result = await service.copyMediaLine(mediaLine, copyContext);

			expect(result.elements ?? []).toHaveLength(1);
		});
	});

	describe('copy media external tool element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const mediaExternalToolElement = mediaExternalToolElementFactory.build();

			return { copyContext, mediaExternalToolElement };
		};

		it('should return the correct type and status', async () => {
			const { copyContext, mediaExternalToolElement } = setup();

			const result = await service.copyMediaExternalToolElement(mediaExternalToolElement, copyContext);

			expect(result).toEqual(
				expect.objectContaining({
					type: CopyElementType.MEDIA_EXTERNAL_TOOL_ELEMENT,
					status: CopyStatusEnum.NOT_DOING,
				})
			);
		});
	});

	describe('copy deleted element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const deletedElement = deletedElementFactory.build();

			return {
				copyContext,
				deletedElement,
			};
		};

		it('should copy the node', async () => {
			const { copyContext, deletedElement } = setup();

			const result = await service.copyDeletedElement(deletedElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(DeletedElement);
		});
	});
});
