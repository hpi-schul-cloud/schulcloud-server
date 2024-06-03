import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { ToolFeatures } from '@modules/tool/tool-config';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Card,
	Column,
	ColumnBoard,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	isCard,
	isColumn,
	isColumnBoard,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isLinkElement,
	isRichTextElement,
	isSubmissionContainerElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '@shared/domain/domainobject';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	drawingElementFactory,
	externalToolElementFactory,
	fileElementFactory,
	linkElementFactory,
	richTextElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { BoardDoCopyService } from './board-do-copy.service';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

describe('recursive board copy visitor', () => {
	let module: TestingModule;
	let service: BoardDoCopyService;

	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let copyHelperService: DeepMocked<CopyHelperService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardDoCopyService,
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: ToolFeatures,
					useValue: {
						ctlToolsCopyEnabled: true,
					},
				},
			],
		}).compile();

		service = module.get(BoardDoCopyService);
		contextExternalToolService = module.get(ContextExternalToolService);
		copyHelperService = module.get(CopyHelperService);

		await setupEntities();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setupfileCopyService = () => {
		const fileCopyService = createMock<SchoolSpecificFileCopyService>();

		return { fileCopyService };
	};

	describe('copying column boards', () => {
		const getColumnBoardCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumnBoard(copy)).toEqual(true);
			return copy as ColumnBoard;
		};

		describe('when copying empty column board', () => {
			const setup = () => {
				const original = columnBoardFactory.build();
				copyHelperService.deriveStatusFromElements.mockReturnValueOnce(CopyStatusEnum.SUCCESS);

				return { original, ...setupfileCopyService() };
			};

			it('should return a columnboard as copy', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(isColumnBoard(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should create new id', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should copy the context', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.context).toEqual(original.context);
			});

			it('should show status successful', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Columnboard', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.type).toEqual(CopyElementType.COLUMNBOARD);
			});

			it('should set the copy to unpublished', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.isVisible).toEqual(false);
			});
		});

		describe('when copying a columnboard with children', () => {
			const setup = () => {
				const children = columnFactory.buildList(5);

				const original = columnBoardFactory.build({ children });

				return { original, ...setupfileCopyService() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnBoardCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('copying a column', () => {
		const getColumnCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isColumn(copy)).toEqual(true);
			return copy as Column;
		};

		describe('when copying an empty column', () => {
			const setup = () => {
				const original = columnFactory.build();

				return { original, ...setupfileCopyService() };
			};

			it('should return a column as copy', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(isColumn(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should create new id', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Column', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.type).toEqual(CopyElementType.COLUMN);
			});
		});

		describe('when copying a column with children', () => {
			const setup = () => {
				const children = cardFactory.buildList(2);
				const original = columnFactory.build({ children });

				return { original, ...setupfileCopyService() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getColumnCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('copying cards', () => {
		const getCardCopyFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isCard(copy)).toEqual(true);
			return copy as Card;
		};

		describe('when copying an empty card', () => {
			const setup = () => {
				const original = cardFactory.build();

				return { original, ...setupfileCopyService() };
			};

			it('should return a richtext element as copy', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(isCard(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getCardCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should copy height', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getCardCopyFromStatus(result);

				expect(copy.height).toEqual(original.height);
			});

			it('should create new id', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getCardCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Card', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.type).toEqual(CopyElementType.CARD);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...richTextElementFactory.buildList(4), ...submissionContainerElementFactory.buildList(3)];
				const original = cardFactory.build({ children });

				return { original, ...setupfileCopyService() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getCardCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getCardCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('when copying a richtext element', () => {
		const setup = () => {
			const original = richTextElementFactory.build();

			return { original, ...setupfileCopyService() };
		};

		const getRichTextFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isRichTextElement(copy)).toEqual(true);
			return copy as RichTextElement;
		};

		it('should return a richtext element as copy', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(isRichTextElement(result.copyEntity)).toEqual(true);
		});

		it('should copy text', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getRichTextFromStatus(result);

			expect(copy.text).toEqual(original.text);
		});

		it('should copy text', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getRichTextFromStatus(result);

			expect(copy.inputFormat).toEqual(original.inputFormat);
		});

		it('should create new id', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getRichTextFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should show status successful', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type RichTextElement', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.RICHTEXT_ELEMENT);
		});
	});

	describe('when copying a drawing element', () => {
		const setup = () => {
			const original = drawingElementFactory.build();

			return { original, ...setupfileCopyService() };
		};

		const getDrawingElementFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isDrawingElement(copy)).toEqual(true);
			return copy as DrawingElement;
		};

		it('should return a drawing element as copy', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(isDrawingElement(result.copyEntity)).toEqual(true);
		});

		it('should copy description', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getDrawingElementFromStatus(result);

			expect(copy.description).toEqual(original.description);
		});

		it('should create new id', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getDrawingElementFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should show status partial', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.status).toEqual(CopyStatusEnum.PARTIAL);
		});

		it('should show type RichTextElement', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.DRAWING_ELEMENT);
		});
	});

	describe('when copying a file element', () => {
		const setup = () => {
			const original = fileElementFactory.build();

			const visitorSetup = setupfileCopyService();

			visitorSetup.fileCopyService.copyFilesOfParent.mockResolvedValueOnce([
				{ id: new ObjectId().toHexString(), sourceId: original.id, name: original.caption },
			]);

			return { original, ...visitorSetup };
		};

		const getFileElementFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isFileElement(copy)).toEqual(true);
			return copy as FileElement;
		};

		it('should return a file element as copy', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(isFileElement(result.copyEntity)).toEqual(true);
		});

		it('should create new id', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getFileElementFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should copy caption', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getFileElementFromStatus(result);

			expect(copy.caption).toEqual(original.caption);
		});

		it('should copy alternative text', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getFileElementFromStatus(result);

			expect(copy.alternativeText).toEqual(original.alternativeText);
		});

		it('should call fileCopy Service', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getFileElementFromStatus(result);

			expect(fileCopyService.copyFilesOfParent).toHaveBeenCalledWith({
				sourceParentId: original.id,
				targetParentId: copy.id,
				parentType: FileRecordParentType.BoardNode,
			});
		});

		it('should show status successful', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type FILE_ELEMENT', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.FILE_ELEMENT);
		});

		it('should include file copy status', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			const fileCopyStatus = result.elements?.at(0);

			expect(fileCopyStatus).toEqual(
				expect.objectContaining({
					status: CopyStatusEnum.SUCCESS,
					type: CopyElementType.FILE,
				})
			);
		});
	});

	describe('copying submission container', () => {
		const getSubmissionContainerFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isSubmissionContainerElement(copy)).toEqual(true);
			return copy as SubmissionContainerElement;
		};

		describe('when copying an empty submission container element', () => {
			const setup = () => {
				const original = submissionContainerElementFactory.build();

				return { original, ...setupfileCopyService() };
			};

			it('should return a submission container element as copy', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(isSubmissionContainerElement(result.copyEntity)).toEqual(true);
			});

			it('should copy dueDate', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.dueDate).toEqual(original.dueDate);
			});

			it('should create new id', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type SUBMISSION_CONTAINER', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.type).toEqual(CopyElementType.SUBMISSION_CONTAINER_ELEMENT);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...submissionItemFactory.buildList(4)];
				const original = submissionContainerElementFactory.build({ children });

				return { original, ...setupfileCopyService() };
			};

			it('should NOT add children to copy of columnboard', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.children.length).toEqual(0);
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('when copying a submission item', () => {
		const setup = () => {
			const original = submissionItemFactory.build();

			return { original, ...setupfileCopyService() };
		};

		it('should NOT make a copy', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.copyEntity).toBeUndefined();
		});

		it('should show status not-doing', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should show type SUBMISSION_ITEM', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.SUBMISSION_ITEM);
		});
	});

	describe('when copying an external tool element', () => {
		describe('when the element has no linked tool', () => {
			const setup = () => {
				const original = externalToolElementFactory.build();

				return { original, ...setupfileCopyService() };
			};

			const getExternalToolElementFromStatus = (status: CopyStatus): ExternalToolElement => {
				const copy = status.copyEntity;

				expect(isExternalToolElement(copy)).toEqual(true);

				return copy as ExternalToolElement;
			};

			it('should return a external tool element as copy', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(isExternalToolElement(result.copyEntity)).toEqual(true);
			});

			it('should not copy tool', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getExternalToolElementFromStatus(result);

				expect(copy.contextExternalToolId).toBeUndefined();
			});

			it('should create new id', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });
				const copy = getExternalToolElementFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type ExternalToolElement', async () => {
				const { original, fileCopyService } = setup();

				const result = await service.copy({ original, fileCopyService });

				expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
			});
		});

		describe('when the element has a linked tool and the feature is active', () => {
			describe('when the linked tool exists', () => {
				const setup = () => {
					const originalTool: ContextExternalTool = contextExternalToolFactory.buildWithId();
					const copiedTool: ContextExternalTool = contextExternalToolFactory.buildWithId();

					const original: ExternalToolElement = externalToolElementFactory.build({
						contextExternalToolId: originalTool.id,
					});

					contextExternalToolService.findById.mockResolvedValueOnce(originalTool);
					contextExternalToolService.copyContextExternalTool.mockResolvedValueOnce(copiedTool);

					return { original, ...setupfileCopyService(), copiedTool };
				};

				const getExternalToolElementFromStatus = (status: CopyStatus): ExternalToolElement => {
					const copy = status.copyEntity;

					expect(isExternalToolElement(copy)).toEqual(true);

					return copy as ExternalToolElement;
				};

				it('should return a external tool element as copy', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(isExternalToolElement(result.copyEntity)).toEqual(true);
				});

				it('should copy tool', async () => {
					const { original, fileCopyService, copiedTool } = setup();

					const result = await service.copy({ original, fileCopyService });
					const copy = getExternalToolElementFromStatus(result);

					expect(copy.contextExternalToolId).toEqual(copiedTool.id);
				});

				it('should create new id', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });
					const copy = getExternalToolElementFromStatus(result);

					expect(copy.id).not.toEqual(original.id);
				});

				it('should show status successful', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
				});

				it('should show type ExternalToolElement', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
				});
			});

			describe('when the linked tool does not exist anymore', () => {
				const setup = () => {
					const original: ExternalToolElement = externalToolElementFactory.build({
						contextExternalToolId: new ObjectId().toHexString(),
					});

					contextExternalToolService.findById.mockResolvedValueOnce(null);

					return { original, ...setupfileCopyService() };
				};

				const getExternalToolElementFromStatus = (status: CopyStatus): ExternalToolElement => {
					const copy = status.copyEntity;

					expect(isExternalToolElement(copy)).toEqual(true);

					return copy as ExternalToolElement;
				};

				it('should return a external tool element as copy', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(isExternalToolElement(result.copyEntity)).toEqual(true);
				});

				it('should not try to copy the tool', async () => {
					const { original, fileCopyService } = setup();

					await service.copy({ original, fileCopyService });

					expect(contextExternalToolService.copyContextExternalTool).not.toHaveBeenCalled();
				});

				it('should create new id', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });
					const copy = getExternalToolElementFromStatus(result);

					expect(copy.id).not.toEqual(original.id);
				});

				it('should show status fail', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(result.status).toEqual(CopyStatusEnum.FAIL);
				});

				it('should show type ExternalToolElement', async () => {
					const { original, fileCopyService } = setup();

					const result = await service.copy({ original, fileCopyService });

					expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
				});
			});
		});
	});

	describe('when copying a link element', () => {
		const setup = () => {
			const original = linkElementFactory.build();

			return { original, ...setupfileCopyService() };
		};

		const getLinkElementFromStatus = (status: CopyStatus): LinkElement => {
			const copy = status.copyEntity;

			expect(isLinkElement(copy)).toEqual(true);

			return copy as LinkElement;
		};

		it('should return a link element as copy', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(isLinkElement(result.copyEntity)).toEqual(true);
		});

		it('should create new id', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });
			const copy = getLinkElementFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should show status successful', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should be of type LinkElement', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.LINK_ELEMENT);
		});
	});
});
