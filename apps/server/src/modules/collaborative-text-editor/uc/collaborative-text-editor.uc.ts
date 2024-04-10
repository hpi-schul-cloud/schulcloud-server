import { Injectable } from '@nestjs/common';
import { CreateCollaborativeTextEditorBodyParams } from '../controller/dto/create-collaborative-text-editor.body.params';
import { CollaborativeTextEditorService } from '../service/collaborative-text-editor.service';

@Injectable()
export class CollaborativeTextEditorUc {
	constructor(private readonly collaborativeTextEditorService: CollaborativeTextEditorService) {}

	async createCollaborativeTextEditor(userId: string, params: CreateCollaborativeTextEditorBodyParams): Promise<void> {
		await this.collaborativeTextEditorService.createCollaborativeTextEditor(userId, params);
	}
}
