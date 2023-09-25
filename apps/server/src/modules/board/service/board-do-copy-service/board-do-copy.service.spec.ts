import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	isCard,
	isColumn,
	isColumnBoard,
	isExternalToolElement,
	isFileElement,
	isRichTextElement,
	isSubmissionContainerElement,
	RichTextElement,
	SubmissionContainerElement,
} from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import {
	cardFactory,
	columnBoardFactory,
	columnFactory,
	externalToolElementFactory,
	fileElementFactory,
	richTextElementFactory,
	setupEntities,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { ObjectId } from 'bson';
import { BoardDoCopyService } from './board-do-copy.service';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

describe('recursive board copy visitor', () => {
	let module: TestingModule;
	let service: BoardDoCopyService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [BoardDoCopyService],
		}).compile();

		service = module.get(BoardDoCopyService);

		await setupEntities();
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

	describe('when copying a external tool element', () => {
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

		it('should show type RichTextElement', async () => {
			const { original, fileCopyService } = setup();

			const result = await service.copy({ original, fileCopyService });

			expect(result.type).toEqual(CopyElementType.EXTERNAL_TOOL_ELEMENT);
		});
	});
});
