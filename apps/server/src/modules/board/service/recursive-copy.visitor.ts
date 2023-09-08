import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	Column,
	ColumnBoard,
	EntityId,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ObjectId } from 'bson';

export type BoardDoCopyParams = {
	originSchoolId: EntityId;
	targetSchoolId: EntityId;
	userId: EntityId;
};

export class RecursiveCopyVisitor implements BoardCompositeVisitorAsync {
	resultMap = new Map<EntityId, CopyStatus>();

	copyMap = new Map<EntityId, AnyBoardDo>();

	constructor(
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly params: BoardDoCopyParams
	) {}

	async copy(original: AnyBoardDo): Promise<CopyStatus> {
		await original.acceptAsync(this);

		const result = this.resultMap.get(original.id);
		if (result === undefined) {
			throw new Error('nothing copied');
		}
		return result;
	}

	async visitColumnBoardAsync(original: ColumnBoard): Promise<void> {
		await this.visitChildrenOf(original);

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

	async visitColumnAsync(original: Column): Promise<void> {
		await this.visitChildrenOf(original);
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

	async visitCardAsync(original: Card): Promise<void> {
		await this.visitChildrenOf(original);
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

	async visitFileElementAsync(original: FileElement): Promise<void> {
		const copy = new FileElement({
			id: new ObjectId().toHexString(),
			caption: original.caption,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		const fileCopy = await this.filesStorageClientAdapterService.copyFilesOfParent({
			source: {
				parentId: original.id,
				parentType: FileRecordParentType.BoardNode,
				schoolId: this.params.originSchoolId,
			},
			target: {
				parentId: copy.id,
				parentType: FileRecordParentType.BoardNode,
				schoolId: this.params.targetSchoolId,
			},
			userId: this.params.userId,
		});
		const fileCopyStatus = fileCopy.map((copyFileDto) => {
			return {
				type: CopyElementType.FILE,
				status: copyFileDto.id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
				title: copyFileDto.name ?? `(old fileid: ${copyFileDto.sourceId})`,
			};
		});
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.FILE_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
			elements: fileCopyStatus,
		});
		this.copyMap.set(original.id, copy);
	}

	async visitRichTextElementAsync(original: RichTextElement): Promise<void> {
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

		return Promise.resolve();
	}

	async visitSubmissionContainerElementAsync(original: SubmissionContainerElement): Promise<void> {
		await this.visitChildrenOf(original);
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

	async visitSubmissionItemAsync(original: SubmissionItem): Promise<void> {
		this.resultMap.set(original.id, {
			type: CopyElementType.SUBMISSION_ITEM,
			status: CopyStatusEnum.NOT_DOING,
		});

		return Promise.resolve();
	}

	async visitChildrenOf(boardDo: AnyBoardDo) {
		return Promise.allSettled(boardDo.children.map((child) => child.acceptAsync(this)));
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
}
