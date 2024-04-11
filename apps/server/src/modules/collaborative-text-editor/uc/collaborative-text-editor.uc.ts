import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { BoardDoAuthorizableService, ColumnBoardService } from '@src/modules/board';
import { GetCollaborativeTextEditorForParentParams } from '../controller/dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditor } from '../domain/do/collaborative-text-editor';
import { CollaborativeTextEditorService } from '../service/collaborative-text-editor.service';

@Injectable()
export class CollaborativeTextEditorUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly collaborativeTextEditorService: CollaborativeTextEditorService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService
	) {}

	async getCollaborativeTextEditorForParent(
		userId: string,
		params: GetCollaborativeTextEditorForParentParams,
		sessionCookieExpireDate: Date
	): Promise<CollaborativeTextEditor> {
		const [user, board] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			await this.columnBoardService.findById(params.boardId),
		]);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(board);

		this.authorizationService.checkPermission(
			user,
			boardDoAuthorizable,
			AuthorizationContextBuilder.read([Permission.COURSE_VIEW])
		);

		const textEditor = await this.collaborativeTextEditorService.createCollaborativeTextEditor(
			userId,
			params,
			sessionCookieExpireDate
		);

		return textEditor;
	}
}
