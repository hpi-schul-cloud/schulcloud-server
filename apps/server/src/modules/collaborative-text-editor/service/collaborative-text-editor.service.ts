import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { CollaborativeTextEditorAdapter } from '../collaborative-text-editor.adapter';
import { CreateCollaborativeTextEditorBodyParams } from '../controller/dto/create-collaborative-text-editor.body.params';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(private readonly collaborativeTextEditorAdapter: CollaborativeTextEditorAdapter, private logger: Logger) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	async createCollaborativeTextEditor(userId: string, params: CreateCollaborativeTextEditorBodyParams): Promise<void> {
		await this.collaborativeTextEditorAdapter.createCollaborativeTextEditor(userId, params);
	}
}
