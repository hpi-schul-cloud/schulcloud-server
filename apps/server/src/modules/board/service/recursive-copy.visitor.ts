import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { ObjectId } from 'bson';

export class RecursiveCopyVisitor implements BoardCompositeVisitor {
	result: CopyStatus | undefined = undefined;

	copy(original: AnyBoardDo): CopyStatus {
		original.accept(this);
		if (this.result === undefined) {
			throw new Error('nothing copied');
		}
		return this.result;
	}

	visitColumnBoard(original: ColumnBoard): void {
		const copy = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: original.title,
			context: original.context,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.result = {
			copyEntity: copy,
			type: CopyElementType.COLUMNBOARD,
			status: CopyStatusEnum.SUCCESS,
		};
	}

	visitColumn(original: Column): void {
		const copy = new Column({
			id: new ObjectId().toHexString(),
			title: original.title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.result = {
			copyEntity: copy,
			type: CopyElementType.COLUMN,
			status: CopyStatusEnum.SUCCESS,
		};
	}

	visitCard(original: Card): void {
		this.throwNotHandled(original);
	}

	visitFileElement(original: FileElement): void {
		this.throwNotHandled(original);
	}

	visitRichTextElement(original: RichTextElement): void {
		this.throwNotHandled(original);
	}

	visitSubmissionContainerElement(original: SubmissionContainerElement): void {
		this.throwNotHandled(original);
	}

	visitSubmissionItem(original: SubmissionItem): void {
		this.throwNotHandled(original);
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot copy element of type: '${component.constructor.name}'`);
	}
}
