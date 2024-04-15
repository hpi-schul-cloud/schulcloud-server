import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { IToolFeatures } from '@modules/tool/tool-config';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	Column,
	ColumnBoard,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { LinkElement } from '@shared/domain/domainobject/board/link-element.do';
import { EntityId } from '@shared/domain/types';
import { SchoolSpecificFileCopyService } from './school-specific-file-copy.interface';

export class RecursiveCopyVisitor implements BoardCompositeVisitorAsync {
	resultMap = new Map<EntityId, CopyStatus>();

	copyMap = new Map<EntityId, AnyBoardDo>();

	constructor(
		private readonly fileCopyService: SchoolSpecificFileCopyService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolFeatures: IToolFeatures
	) {}

	async copy(original: AnyBoardDo): Promise<CopyStatus> {
		await original.acceptAsync(this);

		const result = this.resultMap.get(original.id);
		/* istanbul ignore next */
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
			isVisible: false,
			layout: original.layout,
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
			alternativeText: original.alternativeText,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		const fileCopy = await this.fileCopyService.copyFilesOfParent({
			sourceParentId: original.id,
			targetParentId: copy.id,
			parentType: FileRecordParentType.BoardNode,
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

	async visitDrawingElementAsync(original: DrawingElement): Promise<void> {
		const copy = new DrawingElement({
			id: new ObjectId().toHexString(),
			description: original.description,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.DRAWING_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		});
		this.copyMap.set(original.id, copy);

		return Promise.resolve();
	}

	async visitLinkElementAsync(original: LinkElement): Promise<void> {
		const copy = new LinkElement({
			id: new ObjectId().toHexString(),
			url: original.url,
			title: original.title,
			imageUrl: original.imageUrl,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.LINK_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		};

		if (original.imageUrl) {
			const fileCopy = await this.fileCopyService.copyFilesOfParent({
				sourceParentId: original.id,
				targetParentId: copy.id,
				parentType: FileRecordParentType.BoardNode,
			});
			fileCopy.forEach((copyFileDto) => {
				if (copyFileDto.id) {
					if (copy.imageUrl.includes(copyFileDto.sourceId)) {
						copy.imageUrl = copy.imageUrl.replace(copyFileDto.sourceId, copyFileDto.id);
					} else {
						copy.imageUrl = '';
					}
				}
			});
			const fileCopyStatus = fileCopy.map((copyFileDto) => {
				return {
					type: CopyElementType.FILE,
					status: copyFileDto.id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
					title: copyFileDto.name ?? `(old fileid: ${copyFileDto.sourceId})`,
				};
			});
			result.elements = fileCopyStatus;
		}
		this.resultMap.set(original.id, result);
		this.copyMap.set(original.id, copy);

		return Promise.resolve();
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

	async visitExternalToolElementAsync(original: ExternalToolElement): Promise<void> {
		let status: CopyStatusEnum = CopyStatusEnum.SUCCESS;

		const copy = new ExternalToolElement({
			id: new ObjectId().toHexString(),
			contextExternalToolId: undefined,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		if (this.toolFeatures.ctlToolsCopyEnabled && original.contextExternalToolId) {
			const tool: ContextExternalTool | null = await this.contextExternalToolService.findById(
				original.contextExternalToolId
			);

			if (tool) {
				const copiedTool: ContextExternalTool = await this.contextExternalToolService.copyContextExternalTool(
					tool,
					copy.id
				);

				copy.contextExternalToolId = copiedTool.id;
			} else {
				status = CopyStatusEnum.FAIL;
			}
		}

		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.EXTERNAL_TOOL_ELEMENT,
			status,
		});
		this.copyMap.set(original.id, copy);

		return Promise.resolve();
	}

	async visitMediaBoardAsync(original: MediaBoard): Promise<void> {
		await this.visitChildrenOf(original);

		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_BOARD,
			status: CopyStatusEnum.NOT_DOING,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
	}

	async visitMediaLineAsync(original: MediaLine): Promise<void> {
		await this.visitChildrenOf(original);

		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_LINE,
			status: CopyStatusEnum.NOT_DOING,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
	}

	visitMediaExternalToolElementAsync(original: MediaExternalToolElement): Promise<void> {
		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_EXTERNAL_TOOL_ELEMENT,
			status: CopyStatusEnum.NOT_DOING,
		});

		return Promise.resolve();
	}

	async visitChildrenOf(boardDo: AnyBoardDo): Promise<PromiseSettledResult<void>[]> {
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
