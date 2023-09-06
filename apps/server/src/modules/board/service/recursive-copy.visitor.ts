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
		const copy = new Card({
			id: new ObjectId().toHexString(),
			title: original.title,
			height: original.height,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.result = {
			copyEntity: copy,
			type: CopyElementType.CARD,
			status: CopyStatusEnum.SUCCESS,
		};
	}

	visitFileElement(original: FileElement): void {
		this.throwNotHandled(original);
	}

	visitRichTextElement(original: RichTextElement): void {
		const copy = new RichTextElement({
			id: new ObjectId().toHexString(),
			text: original.text,
			inputFormat: original.inputFormat,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.result = {
			copyEntity: copy,
			type: CopyElementType.RICHTEXTELEMENT,
			status: CopyStatusEnum.SUCCESS,
		};
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
