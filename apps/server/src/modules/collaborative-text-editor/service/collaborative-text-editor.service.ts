import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { CreateCollaborativeTextEditorBodyParams } from '../controller/dto/create-collaborative-text-editor.body.params';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(private readonly collaborativeTextEditorAdapter: EtherpadClientAdapter, private logger: Logger) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	async createCollaborativeTextEditor(userId: string, params: CreateCollaborativeTextEditorBodyParams) {
		const { padId, groupId } = await this.collaborativeTextEditorAdapter.getOrCreateCollaborativeTextEditor(
			userId,
			params.parentId
		);

		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthor(userId);
		const sessionId = await this.collaborativeTextEditorAdapter.getOrCreateSession(authorId, groupId);

		console.log(padId, groupId, sessionId);
		return { padId, groupId, sessionId };
	}
}
