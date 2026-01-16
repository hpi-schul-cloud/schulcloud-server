import { Logger } from '@core/logger';
import { EtherpadClientAdapter } from '@infra/etherpad-client';
import { Inject, Injectable } from '@nestjs/common';
import { GetCollaborativeTextEditorForParentParams } from '../api/dto/get-collaborative-text-editor-for-parent.params';
import {
	COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN,
	CollaborativeTextEditorConfig,
} from '../collaborative-text-editor.config';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(
		private readonly collaborativeTextEditorAdapter: EtherpadClientAdapter,
		@Inject(COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN)
		private readonly config: CollaborativeTextEditorConfig,
		private logger: Logger
	) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	public async getOrCreateCollaborativeTextEditor(
		userId: string,
		userName: string,
		params: GetCollaborativeTextEditorForParentParams
	): Promise<CollaborativeTextEditor> {
		const sessionExpiryDate = this.buildSessionExpiryDate();
		const durationThreshold = this.config.cookieReleaseThreshold;
		const { parentId } = params;

		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroupId(parentId);
		const padId = await this.collaborativeTextEditorAdapter.getOrCreateEtherpadId(groupId, parentId);
		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthorId(userId, userName);
		const sessionId = await this.collaborativeTextEditorAdapter.getOrCreateSessionId(
			groupId,
			authorId,
			parentId,
			sessionExpiryDate,
			durationThreshold
		);

		const url = this.buildPath(padId);

		return {
			sessionId,
			url: url.toString(),
			path: url.pathname,
			sessionExpiryDate,
		};
	}

	public async deleteCollaborativeTextEditorByParentId(parentId: string): Promise<void> {
		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroupId(parentId);

		await this.collaborativeTextEditorAdapter.deleteGroup(groupId);
	}

	public async deleteSessionsByUser(userId: string): Promise<void> {
		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthorId(userId);
		const sessionIds = await this.collaborativeTextEditorAdapter.listSessionIdsOfAuthor(authorId);

		const promises = sessionIds.map((sessionId) => this.collaborativeTextEditorAdapter.deleteSession(sessionId));

		await Promise.all(promises);
	}

	private buildSessionExpiryDate(): Date {
		const cookieExpiresMilliseconds = this.config.cookieExpiresInSeconds * 1000;
		const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds);

		return sessionCookieExpiryDate;
	}

	private buildPath(editorId: string): URL {
		const basePath = this.config.padUri;
		const url = new URL(`${basePath}/${editorId}`);

		return url;
	}
}
