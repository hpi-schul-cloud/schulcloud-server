import { TldrawClientAdapter } from '@infra/tldraw-client';
import { Utils } from '@mikro-orm/core';
import { CollaborativeTextEditorService } from '@modules/collaborative-text-editor';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { type ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { Injectable, NotImplementedException } from '@nestjs/common';
import {
	AnyBoardNode,
	CollaborativeTextEditorElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	H5PElement,
	isCollaborativeTextEditorElement,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isH5PElement,
	isLinkElement,
	isMediaExternalToolElement,
	LinkElement,
	MediaExternalToolElement,
} from '../../domain';

@Injectable()
export class BoardNodeDeleteHooksService {
	constructor(
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly drawingElementAdapterService: TldrawClientAdapter,
		private readonly collaborativeTextEditorService: CollaborativeTextEditorService
	) {}

	public async afterDelete(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		const boardNodes = Utils.asArray(boardNode);

		await Promise.all(boardNodes.map(async (bn): Promise<void> => this.singleAfterDelete(bn)));
	}

	private async singleAfterDelete(boardNode: AnyBoardNode): Promise<void> {
		// TODO improve this e.g. using exhaustive check or discriminated union
		if (isFileElement(boardNode)) {
			await this.afterDeleteFileElement(boardNode);
		} else if (isLinkElement(boardNode)) {
			await this.afterDeleteLinkElement(boardNode);
		} else if (isDrawingElement(boardNode)) {
			await this.afterDeleteDrawingElement(boardNode);
		} else if (isExternalToolElement(boardNode)) {
			await this.afterDeleteExternalToolElement(boardNode);
		} else if (isCollaborativeTextEditorElement(boardNode)) {
			await this.afterDeleteCollaborativeTextEditorElement(boardNode);
		} else if (isMediaExternalToolElement(boardNode)) {
			await this.afterDeleteMediaExternalToolElement(boardNode);
		} else if (isH5PElement(boardNode)) {
			await this.afterDeleteH5PElement(boardNode);
		} else {
			// noop
		}
		await Promise.allSettled(boardNode.children.map(async (child) => this.afterDelete(child)));
	}

	public async afterDeleteFileElement(fileElement: FileElement): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(fileElement.id);
	}

	public async afterDeleteLinkElement(linkElement: LinkElement): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(linkElement.id);
	}

	public async afterDeleteDrawingElement(drawingElement: DrawingElement): Promise<void> {
		await this.drawingElementAdapterService.deleteDrawingBinData(drawingElement.id);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(drawingElement.id);
	}

	public async afterDeleteExternalToolElement(externalToolElement: ExternalToolElement): Promise<void> {
		if (externalToolElement.contextExternalToolId) {
			const linkedTool: ContextExternalTool | null = await this.contextExternalToolService.findById(
				externalToolElement.contextExternalToolId
			);

			if (linkedTool) {
				await this.contextExternalToolService.deleteContextExternalTool(linkedTool);
			}
		}
	}

	public async afterDeleteCollaborativeTextEditorElement(
		collaborativeTextEditorElement: CollaborativeTextEditorElement
	): Promise<void> {
		await this.collaborativeTextEditorService.deleteCollaborativeTextEditorByParentId(
			collaborativeTextEditorElement.id
		);
	}

	public async afterDeleteMediaExternalToolElement(mediaElement: MediaExternalToolElement): Promise<void> {
		const linkedTool: ContextExternalTool | null = await this.contextExternalToolService.findById(
			mediaElement.contextExternalToolId
		);

		if (linkedTool) {
			await this.contextExternalToolService.deleteContextExternalTool(linkedTool);
		}
	}

	public async afterDeleteH5PElement(element: H5PElement): Promise<void> {
		if (element.contentId) {
			await Promise.reject(new NotImplementedException());
		}
	}
}
