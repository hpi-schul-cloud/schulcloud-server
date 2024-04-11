import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { GetCollaborativeTextEditorForParentParams } from '../controller/dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(private readonly collaborativeTextEditorAdapter: EtherpadClientAdapter, private logger: Logger) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	async createCollaborativeTextEditor(
		userId: string,
		params: GetCollaborativeTextEditorForParentParams,
		sessionCookieExpireDate: Date
	): Promise<CollaborativeTextEditor> {
		const padId = await this.collaborativeTextEditorAdapter.getOrCreateCollaborativeTextEditor(userId, params.parentId);

		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthor(userId);
		const sessionId = await this.collaborativeTextEditorAdapter.getOrCreateSession(
			authorId,
			params.parentId,
			sessionCookieExpireDate
		);
		const authorsSessions = await this.collaborativeTextEditorAdapter.listSessionsOfAuthor(authorId);
		const basePath = Configuration.has('ETHERPAD__PAD_URI')
			? (Configuration.get('ETHERPAD__PAD_URI') as string)
			: undefined;

		if (sessionId && padId && basePath && authorsSessions) {
			const url = `${basePath}/${padId}`;

			return {
				sessions: [...authorsSessions, sessionId],
				url,
			};
		}

		throw new Error('Could not create collaborative text editor');
	}
}
