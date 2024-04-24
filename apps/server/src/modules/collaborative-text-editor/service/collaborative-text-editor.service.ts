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
		const { parentId } = params;

		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroupId(parentId);
		const padId = await this.collaborativeTextEditorAdapter.getOrCreateEtherpadId(groupId, parentId);
		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthorId(userId, userName);
		const sessionId = await this.collaborativeTextEditorAdapter.getOrCreateSessionId(
			groupId,
			authorId,
			parentId,
			sessionExpiryDate
		);
		const authorsSessionIds = await this.collaborativeTextEditorAdapter.listSessionIdsOfAuthor(authorId);

		const url = this.buildPath(padId);
		const uniqueSessionIds = this.removeDuplicateSessions([...authorsSessionIds, sessionId]);

		return {
			sessions: uniqueSessionIds,
			url,
			sessionExpiryDate,
		};
	}

	async deleteCollaborativeTextEditor(parentId: string): Promise<void> {
		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroupId(parentId);

		await this.collaborativeTextEditorAdapter.deleteGroup(groupId);
	}

	private removeDuplicateSessions(sessions: string[]): string[] {
		const uniqueSessions = [...new Set(sessions)];

		return uniqueSessions;
	}

	private buildSessionExpiryDate(): Date {
		const cookieExpiresMilliseconds = Number(this.configService.get('ETHERPAD_COOKIE__EXPIRES_SECONDS')) * 1000;
		const sessionCookieExpiryDate = new Date(Date.now() + cookieExpiresMilliseconds);

		return sessionCookieExpiryDate;
	}

	private buildPath(editorId: string): string {
		const basePath = this.configService.get<string>('ETHERPAD__PAD_URI');
		const url = `${basePath}/${editorId}`;

		return url;
	}
}
