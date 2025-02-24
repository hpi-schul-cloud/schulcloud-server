import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardNodeAuthorizableService, BoardNodeService } from '@modules/board';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
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
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService
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

	async deleteSessionsByUser(userId: EntityId): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		await this.collaborativeTextEditorService.deleteSessionsByUser(user.id);
	}

	private async authorizeByParentType(params: GetCollaborativeTextEditorForParentParams, user: User) {
		if (params.parentType === CollaborativeTextEditorParentType.BOARD_CONTENT_ELEMENT) {
			await this.authorizeForContentElement(params, user);
		}
	}

	private async authorizeForContentElement(params: GetCollaborativeTextEditorForParentParams, user: User) {
		const contentElement = await this.boardNodeService.findContentElementById(params.parentId);
		const contentElementDoAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(contentElement);

		this.authorizationService.checkPermission(
			user,
			contentElementDoAuthorizable,
			AuthorizationContextBuilder.read([Permission.COURSE_VIEW])
		);
	}
}
