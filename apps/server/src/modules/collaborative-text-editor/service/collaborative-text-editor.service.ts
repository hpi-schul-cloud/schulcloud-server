import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { ServerConfig } from '@src/modules/server';
import { GetCollaborativeTextEditorForParentParams } from '../controller/dto/get-collaborative-text-editor-for-parent.params';
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

	async createCollaborativeTextEditor(
		userId: string,
		userName: string,
		params: GetCollaborativeTextEditorForParentParams
	): Promise<CollaborativeTextEditor> {
		const sessionExpiryDate = this.buildSessionExpiryDate();
		const { parentId } = params;

		const groupId = await this.collaborativeTextEditorAdapter.getOrCreateGroup(parentId);
		const padId = await this.collaborativeTextEditorAdapter.getOrCreatePad(groupId, parentId);
		const authorId = await this.collaborativeTextEditorAdapter.getOrCreateAuthor(userId, userName);
		const sessionId = await this.collaborativeTextEditorAdapter.getOrCreateSession(
			groupId,
			authorId,
			parentId,
			sessionExpiryDate
		);
		const authorsSessionIds = await this.collaborativeTextEditorAdapter.listSessionsOfAuthor(authorId);

		if (!sessionId || !padId || !authorsSessionIds) {
			throw new InternalServerErrorException('Could not create collaborative text editor');
		}

		const url = this.buildPath(padId);
		const uniqueSessionIds = this.removeDuplicateSessions([...authorsSessionIds, sessionId]);

		return {
			sessions: uniqueSessionIds,
			url,
			sessionExpiryDate,
		};
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
		const basePath = this.configService.get('ETHERPAD__PAD_URI');

		if (!basePath) throw new InternalServerErrorException('ETHERPAD__PAD_URI is not defined');

		const url = `${basePath}/${editorId}`;

		return url;
	}
}
