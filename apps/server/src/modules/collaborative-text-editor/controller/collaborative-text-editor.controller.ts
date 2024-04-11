import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Controller, ForbiddenException, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Response } from 'express';
import { CollaborativeTextEditorUc } from '../uc/collaborative-text-editor.uc';
import { GetCollaborativeTextEditorForParentParams } from './dto/get-collaborative-text-editor-for-parent.params';

@ApiTags('CollaborativeTextEditor')
@Authenticate('jwt')
@Controller('collaborative-text-editor')
export class CollaborativeTextEditorController {
	constructor(private readonly collaborativeTextEditorUc: CollaborativeTextEditorUc) {}

	@ApiOperation({ summary: 'Redirect to CollaborativeTextEditor' })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get('boardId/:boardId/parentId/:parentId')
	async getCollaborativeTextEditorForParent(
		@Param() getCollaborativeTextEditorForParentParams: GetCollaborativeTextEditorForParentParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Res() res: Response
	): Promise<void> {
		const { sessionId, sessionValidUntil, url } =
			await this.collaborativeTextEditorUc.getCollaborativeTextEditorForParent(
				currentUser.userId,
				getCollaborativeTextEditorForParentParams
			);

		res.cookie('sessionID', sessionId, { expires: sessionValidUntil });
		res.redirect(url);
	}
}
