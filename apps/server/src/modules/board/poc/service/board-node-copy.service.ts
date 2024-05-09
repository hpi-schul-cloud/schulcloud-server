import { ObjectId } from '@mikro-orm/mongodb';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { IToolFeatures, ToolFeatures } from '@modules/tool/tool-config';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { ContextExternalTool } from '@src/modules/tool/context-external-tool/domain';
import {
	AnyBoardNode,
	BoardNodeType,
	Card,
	CollaborativeTextEditorElement,
	Column,
	ColumnBoard,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	getBoardNodeType,
	handleNonExhaustiveSwitch,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '../domain';
import { MediaBoard, MediaExternalToolElement, MediaLine } from '../domain/media-board';

export interface CopyContext {
	copyFilesOfParent(sourceParentId: EntityId, targetParentId: EntityId): Promise<CopyFileDto[]>;
}

@Injectable()
export class BoardNodeCopyService {
	constructor(
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async copy(boardNode: AnyBoardNode, context: CopyContext): Promise<CopyStatus> {
		const type = getBoardNodeType(boardNode);

		let result!: CopyStatus;

		switch (type) {
			case BoardNodeType.COLUMN_BOARD:
				result = await this.copyColumnBoard(boardNode as ColumnBoard, context);
				break;
			case BoardNodeType.COLUMN:
				result = await this.copyColumn(boardNode as Column, context);
				break;
			case BoardNodeType.CARD:
				result = await this.copyCard(boardNode as Card, context);
				break;
			case BoardNodeType.FILE_ELEMENT:
				result = await this.copyFileElement(boardNode as FileElement, context);
				break;
			case BoardNodeType.LINK_ELEMENT:
				result = await this.copyLinkElement(boardNode as LinkElement, context);
				break;
			case BoardNodeType.RICH_TEXT_ELEMENT:
				result = await this.copyRichTextElement(boardNode as RichTextElement, context);
				break;
			case BoardNodeType.DRAWING_ELEMENT:
				result = await this.copyDrawingElement(boardNode as DrawingElement, context);
				break;
			case BoardNodeType.SUBMISSION_CONTAINER_ELEMENT:
				result = await this.copySubmissionContainerElement(boardNode as SubmissionContainerElement, context);
				break;
			case BoardNodeType.SUBMISSION_ITEM:
				result = await this.copySubmissionItem(boardNode as SubmissionItem, context);
				break;
			case BoardNodeType.EXTERNAL_TOOL:
				result = await this.copyExternalToolElement(boardNode as ExternalToolElement, context);
				break;
			case BoardNodeType.COLLABORATIVE_TEXT_EDITOR:
				result = await this.copyCollaborativeTextEditorElement(boardNode as CollaborativeTextEditorElement, context);
				break;
			case BoardNodeType.MEDIA_BOARD:
				result = await this.copyMediaBoard(boardNode as MediaBoard, context);
				break;
			case BoardNodeType.MEDIA_LINE:
				result = await this.copyMediaLine(boardNode as MediaLine, context);
				break;
			case BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT:
				result = await this.copyMediaExternalToolElement(boardNode as MediaExternalToolElement, context);
				break;
			default:
				handleNonExhaustiveSwitch(type);
		}

		return result;
	}

	async copyColumnBoard(original: ColumnBoard, context: CopyContext): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const copy = new ColumnBoard({
			...original.getProps(),
			...this.buildSpecificProps(childrenResults),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.COLUMNBOARD,
			status: CopyStatusEnum.SUCCESS,
			elements: childrenResults,
		};

		return result;
	}

	async copyColumn(original: Column, context: CopyContext): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const copy = new Column({
			...original.getProps(),
			...this.buildSpecificProps(childrenResults),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.COLUMN,
			status: CopyStatusEnum.SUCCESS,
			elements: childrenResults,
		};

		return result;
	}

	async copyCard(original: Card, context: CopyContext): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const copy = new Card({
			...original.getProps(),
			...this.buildSpecificProps(childrenResults),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.CARD,
			status: CopyStatusEnum.SUCCESS,
			elements: childrenResults,
		};

		return result;
	}

	async copyFileElement(original: FileElement, context: CopyContext): Promise<CopyStatus> {
		const copy = new FileElement({
			...original.getProps(),
			...this.buildSpecificProps([]),
		});

		const fileCopy = await context.copyFilesOfParent(original.id, copy.id);

		const fileCopyStatus = fileCopy.map((copyFileDto) => {
			return {
				type: CopyElementType.FILE,
				status: copyFileDto.id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
				title: copyFileDto.name ?? `(old fileid: ${copyFileDto.sourceId})`,
			};
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.FILE_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
			elements: fileCopyStatus,
		};

		return result;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copyLinkElement(original: LinkElement, context: CopyContext): Promise<CopyStatus> {
		const copy = new LinkElement({
			...original.getProps(),
			...this.buildSpecificProps([]),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.LINK_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		};

		if (original.imageUrl) {
			const fileCopy = await context.copyFilesOfParent(original.id, copy.id);

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

		return Promise.resolve(result);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copyRichTextElement(original: RichTextElement, context: CopyContext): Promise<CopyStatus> {
		const copy = new RichTextElement({
			...original.getProps(),
			...this.buildSpecificProps([]),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.RICHTEXT_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		};

		return Promise.resolve(result);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copyDrawingElement(original: DrawingElement, context: CopyContext): Promise<CopyStatus> {
		const copy = new DrawingElement({
			...original.getProps(),
			...this.buildSpecificProps([]),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.DRAWING_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
		};

		return Promise.resolve(result);
	}

	async copySubmissionContainerElement(
		original: SubmissionContainerElement,
		context: CopyContext
	): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const copy = new SubmissionContainerElement({
			...original.getProps(),
			...this.buildSpecificProps(childrenResults),
		});

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.SUBMISSION_CONTAINER_ELEMENT,
			status: CopyStatusEnum.SUCCESS,
			elements: childrenResults,
		};

		return Promise.resolve(result);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copySubmissionItem(original: SubmissionItem, context: CopyContext): Promise<CopyStatus> {
		const result: CopyStatus = {
			type: CopyElementType.SUBMISSION_ITEM,
			status: CopyStatusEnum.NOT_DOING,
		};

		return Promise.resolve(result);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copyExternalToolElement(original: ExternalToolElement, context: CopyContext): Promise<CopyStatus> {
		const copy = new ExternalToolElement({
			...original.getProps(),
			...this.buildSpecificProps([]),
		});

		let status: CopyStatusEnum;
		if (this.toolFeatures.ctlToolsCopyEnabled && original.contextExternalToolId) {
			const linkedTool: ContextExternalTool | null = await this.contextExternalToolService.findById(
				original.contextExternalToolId
			);

			if (linkedTool) {
				const contextExternalToolCopy: ContextExternalTool =
					await this.contextExternalToolService.copyContextExternalTool(linkedTool, copy.id);

				copy.contextExternalToolId = contextExternalToolCopy.id;

				status = CopyStatusEnum.SUCCESS;
			} else {
				status = CopyStatusEnum.FAIL;
			}
		} else {
			status = CopyStatusEnum.SUCCESS;
		}

		const result: CopyStatus = {
			copyEntity: copy,
			type: CopyElementType.EXTERNAL_TOOL_ELEMENT,
			status,
		};

		return Promise.resolve(result);
	}

	async copyCollaborativeTextEditorElement(
		original: CollaborativeTextEditorElement,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		context: CopyContext
	): Promise<CopyStatus> {
		return Promise.reject(new Error(`Cannot copy element of type: '${original.constructor.name}'`));
	}

	async copyMediaBoard(original: MediaBoard, context: CopyContext): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const result: CopyStatus = {
			type: CopyElementType.MEDIA_BOARD,
			status: CopyStatusEnum.NOT_DOING,
			elements: childrenResults,
		};

		return Promise.resolve(result);
	}

	async copyMediaLine(original: MediaLine, context: CopyContext): Promise<CopyStatus> {
		const childrenResults = await this.copyChildrenOf(original, context);

		const result: CopyStatus = {
			type: CopyElementType.MEDIA_LINE,
			status: CopyStatusEnum.NOT_DOING,
			elements: childrenResults,
		};

		return Promise.resolve(result);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async copyMediaExternalToolElement(original: MediaExternalToolElement, context: CopyContext): Promise<CopyStatus> {
		const result: CopyStatus = {
			type: CopyElementType.MEDIA_EXTERNAL_TOOL_ELEMENT,
			status: CopyStatusEnum.NOT_DOING,
		};

		return Promise.resolve(result);
	}

	// ----

	private async copyChildrenOf(boardNode: AnyBoardNode, context: CopyContext): Promise<CopyStatus[]> {
		const allSettled = await Promise.allSettled(
			boardNode.children.map(async (child) => {
				return {
					id: child.id,
					status: await this.copy(child, context),
				};
			})
		);

		const resultMap = new Map<EntityId, CopyStatus>();
		allSettled.forEach((res) => {
			if (res.status === 'fulfilled') {
				resultMap.set(res.value.id, res.value.status);
			}
		});

		const results: CopyStatus[] = [];
		boardNode.children.forEach((child) => {
			const childStatus = resultMap.get(child.id);
			if (childStatus) {
				results.push(childStatus);
			}
		});

		return results;
	}

	private buildSpecificProps(childrenResults: CopyStatus[]): {
		id: EntityId;
		createdAt: Date;
		updatedAt: Date;
		children: AnyBoardNode[];
	} {
		return {
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			children: childrenResults.map((r) => r.copyEntity).filter((c) => c !== undefined) as AnyBoardNode[],
		};
	}
}
