import { Utils } from '@mikro-orm/core';
import { CollaborativeTextEditorService } from '@modules/collaborative-text-editor';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { DrawingElementAdapterService } from '@modules/tldraw-client';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { Injectable } from '@nestjs/common';
import {
	AnyBoardNode,
	CollaborativeTextEditorElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	isCollaborativeTextEditorElement,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isLinkElement,
	LinkElement,
} from '../domain';
import { isMediaExternalToolElement, MediaExternalToolElement } from '../domain/media-board';

@Injectable()
export class BoardNodeDeleteHooksService {
	constructor(
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly drawingElementAdapterService: DrawingElementAdapterService,
		private readonly collaborativeTextEditorService: CollaborativeTextEditorService
	) {}

	async afterDelete(boardNode: AnyBoardNode | AnyBoardNode[]): Promise<void> {
		const boardNodes = Utils.asArray(boardNode);

		await Promise.allSettled(boardNodes.map(async (bn) => this.singleAfterDelete(bn)));
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
		}
		await Promise.allSettled(boardNode.children.map(async (child) => this.afterDelete(child)));
	}

	async afterDeleteFileElement(fileElement: FileElement): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(fileElement.id);
	}

	async afterDeleteLinkElement(linkElement: LinkElement): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(linkElement.id);
	}

	async afterDeleteDrawingElement(drawingElement: DrawingElement): Promise<void> {
		await this.drawingElementAdapterService.deleteDrawingBinData(drawingElement.id);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(drawingElement.id);
	}

	async afterDeleteExternalToolElement(externalToolElement: ExternalToolElement): Promise<void> {
		if (externalToolElement.contextExternalToolId) {
			const linkedTool = await this.contextExternalToolService.findById(externalToolElement.contextExternalToolId);

			if (linkedTool) {
				await this.contextExternalToolService.deleteContextExternalTool(linkedTool);
			}
		}
	}

	async afterDeleteCollaborativeTextEditorElement(
		collaborativeTextEditorElement: CollaborativeTextEditorElement
	): Promise<void> {
		await this.collaborativeTextEditorService.deleteCollaborativeTextEditorByParentId(
			collaborativeTextEditorElement.id
		);
	}

	async afterDeleteMediaExternalToolElement(mediaElement: MediaExternalToolElement): Promise<void> {
		const linkedTool = await this.contextExternalToolService.findById(mediaElement.contextExternalToolId);

		if (linkedTool) {
			await this.contextExternalToolService.deleteContextExternalTool(linkedTool);
		}
	}
}
