import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { BoardDoAuthorizableService, ContentElementService } from '@src/modules/board';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';
import { CollaborativeTextEditorService } from '../service/collaborative-text-editor.service';
import {
	CollaborativeTextEditorParentType,
	GetCollaborativeTextEditorForParentParams,
} from './dto/get-collaborative-text-editor-for-parent.params';

@Injectable()
export class CollaborativeTextEditorUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly collaborativeTextEditorService: CollaborativeTextEditorService,
		private readonly contentElementService: ContentElementService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	async getOrCreateCollaborativeTextEditorForParent(
		userId: string,
		params: GetCollaborativeTextEditorForParentParams
	): Promise<CollaborativeTextEditor> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		await this.authorizeByParentType(params, user);

		const userName = `${user.firstName} ${user.lastName}`;
		const textEditor = await this.collaborativeTextEditorService.getOrCreateCollaborativeTextEditor(
			userId,
			userName,
			params
		);

		return textEditor;
	}

	async deleteSessionsByUser(userId: string): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		await this.collaborativeTextEditorService.deleteSessionsByUser(user.id);
	}

	private async authorizeByParentType(params: GetCollaborativeTextEditorForParentParams, user: User) {
		if (params.parentType === CollaborativeTextEditorParentType.BOARD_CONTENT_ELEMENT) {
			await this.authorizeForContentElement(params, user);
		}
	}

	private async authorizeForContentElement(params: GetCollaborativeTextEditorForParentParams, user: User) {
		const contentElement = await this.contentElementService.findById(params.parentId);
		const contentElementDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(contentElement);

		this.authorizationService.checkPermission(
			user,
			contentElementDoAuthorizable,
			AuthorizationContextBuilder.read([Permission.COURSE_VIEW])
		);
	}
}
