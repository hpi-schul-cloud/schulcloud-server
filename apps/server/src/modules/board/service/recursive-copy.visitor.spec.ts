import { createMock } from '@golevelup/ts-jest';
import {
	Card,
	Column,
	ColumnBoard,
	FileElement,
	isCard,
	isColumn,
	isColumnBoard,
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
	fileElementFactory,
	richTextElementFactory,
	submissionContainerElementFactory,
	submissionItemFactory,
} from '@shared/testing';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ObjectId } from 'bson';
import { RecursiveCopyVisitor } from './recursive-copy.visitor';

describe('recursive board copy visitor', () => {
	const setupVisitor = () => {
		const fileAdapter = createMock<FilesStorageClientAdapterService>();

		const userId = new ObjectId().toHexString();
		const originSchoolId = new ObjectId().toHexString();
		const targetSchoolId = new ObjectId().toHexString();

		const visitor = new RecursiveCopyVisitor(fileAdapter, { userId, originSchoolId, targetSchoolId });

		return { fileAdapter, visitor, userId, originSchoolId, targetSchoolId };
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

				return { original, ...setupVisitor() };
			};

			it('should return a columnboard as copy', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(isColumnBoard(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should create new id', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should copy the context', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.context).toEqual(original.context);
			});

			it('should show status successful', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Columnboard', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.type).toEqual(CopyElementType.COLUMNBOARD);
			});
		});

		describe('when copying a columnboard with children', () => {
			const setup = () => {
				const children = columnFactory.buildList(5);

				const original = columnBoardFactory.build({ children });

				return { original, ...setupVisitor() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnBoardCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnBoardCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

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

				return { original, ...setupVisitor() };
			};

			it('should return a column as copy', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(isColumn(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should create new id', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Column', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.type).toEqual(CopyElementType.COLUMN);
			});
		});

		describe('when copying a column with children', () => {
			const setup = () => {
				const children = cardFactory.buildList(2);
				const original = columnFactory.build({ children });

				return { original, ...setupVisitor() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getColumnCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

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

				return { original, ...setupVisitor() };
			};

			it('should return a richtext element as copy', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(isCard(result.copyEntity)).toEqual(true);
			});

			it('should copy title', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getCardCopyFromStatus(result);

				expect(copy.title).toEqual(original.title);
			});

			it('should copy height', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getCardCopyFromStatus(result);

				expect(copy.height).toEqual(original.height);
			});

			it('should create new id', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getCardCopyFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type Card', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.type).toEqual(CopyElementType.CARD);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...richTextElementFactory.buildList(4), ...submissionContainerElementFactory.buildList(3)];
				const original = cardFactory.build({ children });

				return { original, ...setupVisitor() };
			};

			it('should add children to copy of columnboard', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getCardCopyFromStatus(result);

				expect(copy.children.length).toEqual(original.children.length);
			});

			it('should create copies of children', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getCardCopyFromStatus(result);

				const originalChildIds = original.children.map((child) => child.id);
				const copyChildrenIds = copy.children.map((child) => child.id);

				originalChildIds.forEach((id) => {
					const index = copyChildrenIds.findIndex((value) => value === id);
					expect(index).toEqual(-1);
				});
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('when copying a richtext element', () => {
		const setup = () => {
			const original = richTextElementFactory.build();

			return { original, ...setupVisitor() };
		};

		const getRichTextFromStatus = (status: CopyStatus) => {
			const copy = status.copyEntity;
			expect(isRichTextElement(copy)).toEqual(true);
			return copy as RichTextElement;
		};

		it('should return a richtext element as copy', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(isRichTextElement(result.copyEntity)).toEqual(true);
		});

		it('should copy text', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);
			const copy = getRichTextFromStatus(result);

			expect(copy.text).toEqual(original.text);
		});

		it('should copy text', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);
			const copy = getRichTextFromStatus(result);

			expect(copy.inputFormat).toEqual(original.inputFormat);
		});

		it('should create new id', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);
			const copy = getRichTextFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should show status successful', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type RichTextElement', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.type).toEqual(CopyElementType.RICHTEXT_ELEMENT);
		});
	});

	describe('when copying a file element', () => {
		const setup = () => {
			const original = fileElementFactory.build();

			const visitorSetup = setupVisitor();

			visitorSetup.fileAdapter.copyFilesOfParent.mockResolvedValueOnce([
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
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(isFileElement(result.copyEntity)).toEqual(true);
		});

		it('should create new id', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);
			const copy = getFileElementFromStatus(result);

			expect(copy.id).not.toEqual(original.id);
		});

		it('should copy caption', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);
			const copy = getFileElementFromStatus(result);

			expect(copy.caption).toEqual(original.caption);
		});

		it('should call fileCopy Service', async () => {
			const { original, fileAdapter, visitor, targetSchoolId, originSchoolId, userId } = setup();

			const result = await visitor.copy(original);
			const copy = getFileElementFromStatus(result);

			expect(fileAdapter.copyFilesOfParent).toHaveBeenCalledWith({
				source: {
					parentId: original.id,
					parentType: FileRecordParentType.BoardNode,
					schoolId: originSchoolId,
				},
				target: {
					parentId: copy.id,
					parentType: FileRecordParentType.BoardNode,
					schoolId: targetSchoolId,
				},
				userId,
			});
		});

		it('should show status successful', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should show type FILE_ELEMENT', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.type).toEqual(CopyElementType.FILE_ELEMENT);
		});

		it('should include file copy status', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

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

				return { original, ...setupVisitor() };
			};

			it('should return a submission container element as copy', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(isSubmissionContainerElement(result.copyEntity)).toEqual(true);
			});

			it('should copy dueDate', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.dueDate).toEqual(original.dueDate);
			});

			it('should create new id', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.id).not.toEqual(original.id);
			});

			it('should show status successful', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should show type SUBMISSION_CONTAINER', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.type).toEqual(CopyElementType.SUBMISSION_CONTAINER_ELEMENT);
			});
		});

		describe('when copying a card with children', () => {
			const setup = () => {
				const children = [...submissionItemFactory.buildList(4)];
				const original = submissionContainerElementFactory.build({ children });

				return { original, ...setupVisitor() };
			};

			it('should NOT add children to copy of columnboard', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);
				const copy = getSubmissionContainerFromStatus(result);

				expect(copy.children.length).toEqual(0);
			});

			it('should add status of child copies to copystatus', async () => {
				const { original, visitor } = setup();

				const result = await visitor.copy(original);

				expect(result.elements?.length).toEqual(original.children.length);
			});
		});
	});

	describe('when copying a submission item', () => {
		const setup = () => {
			const original = submissionItemFactory.build();

			return { original, ...setupVisitor() };
		};

		it('should NOT make a copy', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.copyEntity).toBeUndefined();
		});

		it('should show status not-doing', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.status).toEqual(CopyStatusEnum.NOT_DOING);
		});

		it('should show type SUBMISSION_ITEM', async () => {
			const { original, visitor } = setup();

			const result = await visitor.copy(original);

			expect(result.type).toEqual(CopyElementType.SUBMISSION_ITEM);
		});
	});
});
