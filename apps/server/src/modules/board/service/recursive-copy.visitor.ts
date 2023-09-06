import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	EntityId,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { ObjectId } from 'bson';

export class RecursiveCopyVisitor implements BoardCompositeVisitor {
	resultMap = new Map<EntityId, CopyStatus>();

	copyMap = new Map<EntityId, AnyBoardDo>();

	copy(original: AnyBoardDo): CopyStatus {
		original.accept(this);

		const result = this.resultMap.get(original.id);
		if (result === undefined) {
			throw new Error('nothing copied');
		}
		return result;
	}

	visitChildrenOf(boardDo: AnyBoardDo) {
		boardDo.children.forEach((child) => {
			child.accept(this);
		});
	}

	getCopyStatusesForChildrenOf(original: AnyBoardDo) {
		const childstatusses: CopyStatus[] = [];

		original.children.forEach((child) => {
			const childStatus = this.resultMap.get(child.id);
			if (childStatus) {
				childstatusses.push(childStatus);
			}
		});

		return childstatusses;
	}

	getCopiesForChildrenOf(original: AnyBoardDo) {
		const copies: AnyBoardDo[] = [];
		original.children.forEach((child) => {
			const childCopy = this.copyMap.get(child.id);
			if (childCopy) {
				copies.push(childCopy);
			}
		});

		return copies;
	}

	visitColumnBoard(original: ColumnBoard): void {
		this.visitChildrenOf(original);

		const copy = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: original.title,
			context: original.context,
			createdAt: new Date(),
			updatedAt: new Date(),
			children: this.getCopiesForChildrenOf(original),
		});

		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.COLUMNBOARD,
			status: CopyStatusEnum.SUCCESS,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
		this.copyMap.set(original.id, copy);
	}

	visitColumn(original: Column): void {
		this.visitChildrenOf(original);
		const copy = new Column({
			id: new ObjectId().toHexString(),
			title: original.title,
			children: this.getCopiesForChildrenOf(original),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.COLUMN,
			status: CopyStatusEnum.SUCCESS,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
		this.copyMap.set(original.id, copy);
	}

	visitCard(original: Card): void {
		this.visitChildrenOf(original);
		const copy = new Card({
			id: new ObjectId().toHexString(),
			title: original.title,
			height: original.height,
			children: this.getCopiesForChildrenOf(original),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.CARD,
			status: CopyStatusEnum.SUCCESS,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
		this.copyMap.set(original.id, copy);
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
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.RICHTEXT_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		});
		this.copyMap.set(original.id, copy);
	}

	visitSubmissionContainerElement(original: SubmissionContainerElement): void {
		this.visitChildrenOf(original);
		const copy = new SubmissionContainerElement({
			id: new ObjectId().toHexString(),
			dueDate: original.dueDate,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.SUBMISSION_CONTAINER_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
		this.copyMap.set(original.id, copy);
	}

	visitSubmissionItem(original: SubmissionItem): void {
		this.resultMap.set(original.id, {
			type: CopyElementType.SUBMISSION_ITEM,
			status: CopyStatusEnum.NOT_DOING,
		});
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot copy element of type: '${component.constructor.name}'`);
	}
}
