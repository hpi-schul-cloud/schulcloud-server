import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { ServerConfig } from '@src/modules/server';
import { GetCollaborativeTextEditorForParentParams } from '../api/dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';

@Injectable()
export class CollaborativeTextEditorService {
	constructor(
		private readonly collaborativeTextEditorAdapter: EtherpadClientAdapter,
		private readonly configService: ConfigService<ServerConfig, true>,
		private logger: Logger
	) {
		this.logger.setContext(CollaborativeTextEditorService.name);
	}

	async getOrCreateCollaborativeTextEditor(
		userId: string,
		userName: string,
		params: GetCollaborativeTextEditorForParentParams
	): Promise<CollaborativeTextEditor> {
		const sessionExpiryDate = this.buildSessionExpiryDate();
		const durationThreshold = Number(this.configService.get('ETHERPAD_COOKIE_RELEASE_THRESHOLD'));
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

	async deleteCollaborativeTextEditorByParentId(parentId: string): Promise<void> {
		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroupId(parentId);

		await this.collaborativeTextEditorAdapter.deleteGroup(groupId);
	}

	async deleteSessionsByUser(userId: string): Promise<void> {
		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthorId(userId);
		const sessionIds = await this.collaborativeTextEditorAdapter.listSessionIdsOfAuthor(authorId);

		const promises = sessionIds.map((sessionId) => this.collaborativeTextEditorAdapter.deleteSession(sessionId));

		await Promise.all(promises);
	}

	private buildSessionExpiryDate(): Date {
		const cookieExpiresMilliseconds = Number(this.configService.get('ETHERPAD_COOKIE_EXPIRES_SECONDS')) * 1000;
		const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds);

		return sessionCookieExpiryDate;
	}

	private buildPath(editorId: string): URL {
		const basePath = this.configService.get<string>('ETHERPAD__PAD_URI');
		const url = new URL(`${basePath}/${editorId}`);

		return url;
	}
}
