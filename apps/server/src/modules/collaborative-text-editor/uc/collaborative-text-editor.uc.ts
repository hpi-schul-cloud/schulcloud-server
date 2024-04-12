import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { BoardDoAuthorizableService, ContentElementService } from '@src/modules/board';
import { GetCollaborativeTextEditorForParentParams } from '../controller/dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';
import { CollaborativeTextEditorService } from '../service/collaborative-text-editor.service';

@Injectable()
export class CollaborativeTextEditorUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly collaborativeTextEditorService: CollaborativeTextEditorService,
		private readonly contentElementService: ContentElementService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	async getCollaborativeTextEditorForParent(
		userId: string,
		params: GetCollaborativeTextEditorForParentParams
	): Promise<CollaborativeTextEditor> {
		const [user, contentElement] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			await this.contentElementService.findById(params.parentId),
		]);
		const contentElementDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(contentElement);

		this.authorizationService.checkPermission(
			user,
			contentElementDoAuthorizable,
			AuthorizationContextBuilder.read([Permission.COURSE_VIEW])
		);

		const userName = `${user.firstName} ${user.lastName}`;
		const textEditor = await this.collaborativeTextEditorService.createCollaborativeTextEditor(
			userId,
			userName,
			params
		);

		return textEditor;
	}
}
