import { FileRecordParentType } from '@infra/rabbitmq';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { IToolFeatures } from '@modules/tool/tool-config';
import {
	AnyBoardDo,
	BoardCompositeVisitorAsync,
	Card,
	CollaborativeTextEditorElement,
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
		private readonly toolFeatures: IToolFeatures,
		private readonly copyHelperService: CopyHelperService
	) {}

	public async copy(original: AnyBoardDo): Promise<CopyStatus> {
		await original.acceptAsync(this);

		const result = this.resultMap.get(original.id);
		/* istanbul ignore next */
		if (result === undefined) {
			throw new Error('nothing copied');
		}
		return result;
	}

	public async visitColumnBoardAsync(original: ColumnBoard): Promise<void> {
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

		const copyStatusOfChildren = this.getCopyStatusesForChildrenOf(original);
		const status = this.copyHelperService.deriveStatusFromElements(copyStatusOfChildren);

		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.COLUMNBOARD,
			status,
			elements: copyStatusOfChildren,
		});
		this.copyMap.set(original.id, copy);
	}

	public async visitColumnAsync(original: Column): Promise<void> {
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

	public async visitCardAsync(original: Card): Promise<void> {
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

	public async visitFileElementAsync(original: FileElement): Promise<void> {
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

	public async visitDrawingElementAsync(original: DrawingElement): Promise<void> {
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
			status: CopyStatusEnum.PARTIAL,
		});
		this.copyMap.set(original.id, copy);

		return Promise.resolve();
	}

	public async visitLinkElementAsync(original: LinkElement): Promise<void> {
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

	public async visitRichTextElementAsync(original: RichTextElement): Promise<void> {
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

	public async visitSubmissionContainerElementAsync(original: SubmissionContainerElement): Promise<void> {
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

	public async visitSubmissionItemAsync(original: SubmissionItem): Promise<void> {
		this.resultMap.set(original.id, {
			type: CopyElementType.SUBMISSION_ITEM,
			status: CopyStatusEnum.NOT_DOING,
		});

		return Promise.resolve();
	}

	public async visitExternalToolElementAsync(original: ExternalToolElement): Promise<void> {
		const boardElementCopy: ExternalToolElement = new ExternalToolElement({
			id: new ObjectId().toHexString(),
			contextExternalToolId: undefined,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		let status: CopyStatusEnum;
		if (this.toolFeatures.ctlToolsCopyEnabled && original.contextExternalToolId) {
			const linkedTool: ContextExternalTool | null = await this.contextExternalToolService.findById(
				original.contextExternalToolId
			);

			if (linkedTool) {
				const contextExternalToolCopy: ContextExternalTool =
					await this.contextExternalToolService.copyContextExternalTool(linkedTool, boardElementCopy.id);

				boardElementCopy.contextExternalToolId = contextExternalToolCopy.id;

				status = CopyStatusEnum.SUCCESS;
			} else {
				status = CopyStatusEnum.FAIL;
			}
		} else {
			status = CopyStatusEnum.SUCCESS;
		}

		this.resultMap.set(original.id, {
			copyEntity: boardElementCopy,
			type: CopyElementType.EXTERNAL_TOOL_ELEMENT,
			status,
		});
		this.copyMap.set(original.id, boardElementCopy);

		return Promise.resolve();
	}

	public async visitCollaborativeTextEditorElementAsync(original: CollaborativeTextEditorElement): Promise<void> {
		const now = new Date();
		const copy = new CollaborativeTextEditorElement({
			id: new ObjectId().toHexString(),
			createdAt: now,
			updatedAt: now,
		});

		this.resultMap.set(original.id, {
			copyEntity: copy,
			type: CopyElementType.COLLABORATIVE_TEXT_EDITOR_ELEMENT,
			status: CopyStatusEnum.PARTIAL,
		});
		this.copyMap.set(original.id, copy);

		return Promise.resolve();
	}

	public async visitMediaBoardAsync(original: MediaBoard): Promise<void> {
		await this.visitChildrenOf(original);

		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_BOARD,
			status: CopyStatusEnum.NOT_DOING,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
	}

	public async visitMediaLineAsync(original: MediaLine): Promise<void> {
		await this.visitChildrenOf(original);

		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_LINE,
			status: CopyStatusEnum.NOT_DOING,
			elements: this.getCopyStatusesForChildrenOf(original),
		});
	}

	public visitMediaExternalToolElementAsync(original: MediaExternalToolElement): Promise<void> {
		this.resultMap.set(original.id, {
			type: CopyElementType.MEDIA_EXTERNAL_TOOL_ELEMENT,
			status: CopyStatusEnum.NOT_DOING,
		});

		return Promise.resolve();
	}

	private async visitChildrenOf(boardDo: AnyBoardDo): Promise<PromiseSettledResult<void>[]> {
		return Promise.allSettled(boardDo.children.map((child) => child.acceptAsync(this)));
	}

	private getCopyStatusesForChildrenOf(original: AnyBoardDo) {
		const childstatusses: CopyStatus[] = [];

		original.children.forEach((child) => {
			const childStatus = this.resultMap.get(child.id);
			if (childStatus) {
				childstatusses.push(childStatus);
			}
		});
		console.log(childstatusses);

		return childstatusses;
	}

	private getCopiesForChildrenOf(original: AnyBoardDo) {
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
