import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { StorageLocation } from '@infra/files-storage-client';
import { CopyContentParams, CopyContentParentType, H5pEditorProducer } from '@infra/h5p-editor-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { CopyContextExternalToolRejectData } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import {
	contextExternalToolFactory,
	copyContextExternalToolRejectDataFactory,
} from '@modules/tool/context-external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';

import { BOARD_CONFIG_TOKEN, BoardConfig } from '@modules/board/board.config';
import { copyFileDtoFactory } from '@modules/files-storage-client/testing';
import {
	Card,
	CollaborativeTextEditorElement,
	Column,
	ColumnBoard,
	DeletedElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	FileFolderElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
	VideoConferenceElement,
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
	fileFolderElementFactory,
	h5pElementFactory,
	linkElementFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	mediaLineFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
	videoConferenceElementFactory,
} from '../../testing';
import { BoardNodeCopyContext, BoardNodeCopyContextProps } from './board-node-copy-context';
import { BoardNodeCopyService } from './board-node-copy.service';

describe(BoardNodeCopyService.name, () => {
	let module: TestingModule;
	let service: BoardNodeCopyService;
	let config: BoardConfig;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let h5pEditorProducer: DeepMocked<H5pEditorProducer>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardNodeCopyService,
				{
					provide: BOARD_CONFIG_TOKEN,
					useValue: {},
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: H5pEditorProducer,
					useValue: createMock<H5pEditorProducer>(),
				},
			],
		}).compile();

		service = module.get(BoardNodeCopyService);
		contextExternalToolService = module.get(ContextExternalToolService);
		copyHelperService = module.get(CopyHelperService);
		h5pEditorProducer = module.get(H5pEditorProducer);
		config = module.get<BoardConfig>(BOARD_CONFIG_TOKEN);
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setupContext = () => {
		const contextProps: BoardNodeCopyContextProps = {
			sourceStorageLocationReference: { id: new ObjectId().toHexString(), type: StorageLocation.SCHOOL },
			targetStorageLocationReference: { id: new ObjectId().toHexString(), type: StorageLocation.SCHOOL },
			userId: new ObjectId().toHexString(),
			filesStorageClientAdapterService: createMock<FilesStorageClientAdapterService>(),
			targetSchoolId: new ObjectId().toHexString(),
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

		it('should copy the original node', async () => {
			const { copyContext, columnBoard } = setup();

			const result = await service.copyColumnBoard(columnBoard, copyContext);

			expect(result.originalEntity).toBeInstanceOf(ColumnBoard);
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

		it('should copy the original node', async () => {
			const { copyContext, column } = setup();

			const result = await service.copyColumn(column, copyContext);

			expect(result.originalEntity).toBeInstanceOf(Column);
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

		it('should copy the original node', async () => {
			const { copyContext, card } = setup();

			const result = await service.copyCard(card, copyContext);

			expect(result.originalEntity).toBeInstanceOf(Card);
		});
		it('should copy the children', async () => {
			const { copyContext, card } = setup();

			const result = await service.copyCard(card, copyContext);

			expect((result.elements ?? [])[0].copyEntity).toBeInstanceOf(RichTextElement);
		});
	});

	describe('copy file element', () => {
		describe('when copying is successful', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const fileElement = fileElementFactory.build();
				const fileCopyStatus = copyFileDtoFactory.build();
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
				expect(result.elements).toEqual([expect.objectContaining({ title: fileCopyStatus.name })]);
			});
		});

		describe('when copying is not successful', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const fileElement = fileElementFactory.build();
				const fileCopyStatus = copyFileDtoFactory.build({ id: undefined, name: undefined });

				jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

				return { copyContext, fileElement, fileCopyStatus };
			};

			it('should return the node with failed status and default title', async () => {
				const { copyContext, fileElement, fileCopyStatus } = setup();

				const result = await service.copyFileElement(fileElement, copyContext);

				expect(copyContext.copyFilesOfParent).toHaveBeenCalledWith(fileElement.id, result.copyEntity?.id);
				expect(result.elements).toEqual([
					expect.objectContaining({ title: `(old fileid: ${fileCopyStatus.sourceId})`, status: CopyStatusEnum.FAIL }),
				]);
			});
		});
	});

	describe('copy file folder element', () => {
		describe('when copying is successfull', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const fileFolderElement = fileFolderElementFactory.build();

				const fileCopyStatus = copyFileDtoFactory.build();
				jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

				return { copyContext, fileFolderElement, fileCopyStatus };
			};

			it('should copy the node', async () => {
				const { copyContext, fileFolderElement } = setup();

				const result = await service.copyFileFolderElement(fileFolderElement, copyContext);

				expect(result.copyEntity).toBeInstanceOf(FileFolderElement);
			});

			it('should copy the files', async () => {
				const { copyContext, fileFolderElement, fileCopyStatus } = setup();

				const result = await service.copyFileFolderElement(fileFolderElement, copyContext);

				expect(copyContext.copyFilesOfParent).toHaveBeenCalledWith(fileFolderElement.id, result.copyEntity?.id);
				expect(result.elements).toEqual([
					expect.objectContaining({ title: fileCopyStatus.name, status: CopyStatusEnum.SUCCESS }),
				]);
			});
		});

		describe('when copying is not successfull', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const fileFolderElement = fileFolderElementFactory.build();

				const fileCopyStatus = copyFileDtoFactory.build({ id: undefined, name: undefined });
				jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

				return { copyContext, fileFolderElement, fileCopyStatus };
			};

			it('should return the node with failed status and default title', async () => {
				const { copyContext, fileFolderElement, fileCopyStatus } = setup();

				const result = await service.copyFileFolderElement(fileFolderElement, copyContext);

				expect(copyContext.copyFilesOfParent).toHaveBeenCalledWith(fileFolderElement.id, result.copyEntity?.id);
				expect(result.elements).toEqual([
					expect.objectContaining({ title: `(old fileid: ${fileCopyStatus.sourceId})`, status: CopyStatusEnum.FAIL }),
				]);
			});
		});
	});

	describe('copy link element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const sourceId = new ObjectId().toHexString();
			const linkElementFileName = `bird.jpg`;
			const linkElement = linkElementFactory.build({
				id: sourceId,
				imageUrl: `https://example.com/${sourceId}/${linkElementFileName}`,
			});
			const linkElementWithoutId = linkElementFactory.build({
				id: sourceId,
				imageUrl: `https://example.com/plane.jpg`,
			});
			const fileCopyStatus = copyFileDtoFactory.build({ sourceId, name: linkElementFileName });

			jest.spyOn(copyContext, 'copyFilesOfParent').mockResolvedValueOnce([fileCopyStatus]);

			return { copyContext, linkElement, linkElementWithoutId, fileCopyStatus };
		};

		it('should copy the node', async () => {
			const { copyContext, linkElement } = setup();

			const result = await service.copyLinkElement(linkElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(LinkElement);
		});

		it('should copy the original node', async () => {
			const { copyContext, linkElement } = setup();

			const result = await service.copyLinkElement(linkElement, copyContext);

			expect(result.originalEntity).toBeInstanceOf(LinkElement);
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

				expect((result.copyEntity as LinkElement).imageUrl).toBe(
					// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
					`https://example.com/${fileCopyStatus.id}/${fileCopyStatus.name ?? ''}`
				);
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

				config.featureCtlToolsCopyEnabled = true;

				return { copyContext, externalToolElement };
			};

			describe('when linked external tool is found', () => {
				const setupToolElement = () => {
					const { copyContext, externalToolElement } = setupCopyEnabled();

					const contextTool = contextExternalToolFactory.build();
					contextExternalToolService.findById.mockResolvedValueOnce(contextTool);
					externalToolElement.contextExternalToolId = contextTool.id;

					return { copyContext, externalToolElement, contextTool };
				};

				describe('when the copying of context external tool is successful', () => {
					const setupCopySuccess = () => {
						const { copyContext, externalToolElement, contextTool } = setupToolElement();

						const copiedTool = contextExternalToolFactory.build();
						contextExternalToolService.copyContextExternalTool.mockResolvedValue(copiedTool);

						return { copyContext, externalToolElement, contextTool, copiedTool };
					};

					it('should return the copied entity as ExternalTool', async () => {
						const { copyContext, externalToolElement, contextTool, copiedTool } = setupCopySuccess();

						const result = await service.copyExternalToolElement(externalToolElement, copyContext);

						expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(
							contextTool,
							result.copyEntity?.id,
							copyContext.targetSchoolId
						);
						expect(result.copyEntity instanceof ExternalToolElement).toEqual(true);
						expect((result.copyEntity as ExternalToolElement).contextExternalToolId).toEqual(copiedTool.id);
						expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
						expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
					});
				});

				describe('when the copying of context external tool is rejected', () => {
					const setupCopyRejected = () => {
						const { copyContext, externalToolElement, contextTool } = setupToolElement();

						const copyRejectData = copyContextExternalToolRejectDataFactory.build();
						const mockWithCorrectType = Object.create(
							CopyContextExternalToolRejectData.prototype
						) as CopyContextExternalToolRejectData;
						Object.assign(mockWithCorrectType, { ...copyRejectData });
						contextExternalToolService.copyContextExternalTool.mockResolvedValue(mockWithCorrectType);

						return { copyContext, externalToolElement, contextTool };
					};

					it('should return the copied entity as DeletedElement', async () => {
						const { externalToolElement, copyContext, contextTool } = setupCopyRejected();

						const result = await service.copyExternalToolElement(externalToolElement, copyContext);

						expect(contextExternalToolService.copyContextExternalTool).toHaveBeenCalledWith(
							contextTool,
							expect.any(String),
							copyContext.targetSchoolId
						);
						expect(result.copyEntity instanceof DeletedElement).toEqual(true);
						expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
						expect(result.status).toEqual(CopyStatusEnum.FAIL);
					});
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

				config.featureCtlToolsCopyEnabled = false;

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

	describe('copy video conference element', () => {
		const setup = () => {
			const { copyContext } = setupContext();
			const videoConferenceElement = videoConferenceElementFactory.build();

			return {
				copyContext,
				videoConferenceElement,
			};
		};

		it('should copy the node', async () => {
			const { copyContext, videoConferenceElement } = setup();

			const result = await service.copyVideoConferenceElement(videoConferenceElement, copyContext);

			expect(result.copyEntity).toBeInstanceOf(VideoConferenceElement);
		});
	});

	describe('copy h5p element', () => {
		describe('when the h5p element has a content id', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const h5pElement = h5pElementFactory.build({
					contentId: new ObjectId().toHexString(),
				});

				return {
					copyContext,
					h5pElement,
				};
			};

			it('should copy the node', async () => {
				const { copyContext, h5pElement } = setup();

				const result = await service.copyH5pElement(h5pElement, copyContext);

				expect(result).toEqual<CopyStatus>({
					copyEntity: h5pElementFactory.build({
						...h5pElement.getProps(),
						contentId: expect.any(String),
						id: expect.any(String),
					}),
					type: CopyElementType.H5P_ELEMENT,
					status: CopyStatusEnum.SUCCESS,
					elements: [],
				});
			});

			it('should call the copy method of the h5p editor producer', async () => {
				const { copyContext, h5pElement } = setup();

				await service.copyH5pElement(h5pElement, copyContext);

				expect(h5pEditorProducer.copyContent).toHaveBeenCalledWith(
					expect.objectContaining<CopyContentParams>({
						sourceContentId: h5pElement.contentId as string,
						copiedContentId: expect.any(String),
						userId: copyContext.userId,
						schoolId: copyContext.targetSchoolId,
						parentType: CopyContentParentType.BoardElement,
						parentId: expect.any(String),
					})
				);
			});
		});

		describe('when the h5p element has no content id', () => {
			const setup = () => {
				const { copyContext } = setupContext();
				const h5pElement = h5pElementFactory.build({
					contentId: undefined,
				});

				return {
					copyContext,
					h5pElement,
				};
			};

			it('should copy the h5p element with no content id', async () => {
				const { copyContext, h5pElement } = setup();

				const result = await service.copyH5pElement(h5pElement, copyContext);

				expect(result).toEqual<CopyStatus>({
					copyEntity: h5pElementFactory.build({
						...h5pElement.getProps(),
						contentId: undefined,
						id: expect.any(String),
					}),
					type: CopyElementType.H5P_ELEMENT,
					status: CopyStatusEnum.SUCCESS,
					elements: [],
				});
			});
		});
	});
});
