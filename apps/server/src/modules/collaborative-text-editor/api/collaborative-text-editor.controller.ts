import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { Response } from 'express';
import { CollaborativeTextEditorUc } from './collaborative-text-editor.uc';
import { CollaborativeTextEditorResponse } from './dto/collaborative-text-editor.response';
import { GetCollaborativeTextEditorForParentParams } from './dto/get-collaborative-text-editor-for-parent.params';
import { CollaborativeTextEditorMapper } from './mapper/collaborative-text-editor.mapper';

@ApiTags('CollaborativeTextEditor')
@JwtAuthentication()
@Controller('collaborative-text-editor')
export class CollaborativeTextEditorController {
	constructor(private readonly collaborativeTextEditorUc: CollaborativeTextEditorUc) {}

	@ApiOperation({ summary: 'Get or create CollaborativeTextEditor for parent' })
	@ApiResponse({ status: 200, type: CollaborativeTextEditorResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get('/:parentType/:parentId')
	async getOrCreateCollaborativeTextEditorForParent(
		@Param() getCollaborativeTextEditorForParentParams: GetCollaborativeTextEditorForParentParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Res({ passthrough: true }) res: Response
	): Promise<CollaborativeTextEditorResponse> {
		const textEditor = await this.collaborativeTextEditorUc.getOrCreateCollaborativeTextEditorForParent(
			currentUser.userId,
			getCollaborativeTextEditorForParentParams
		);

		res.cookie('sessionID', textEditor.sessionId, {
			expires: textEditor.sessionExpiryDate,
			secure: true,
			path: textEditor.path,
		});

		const dto = CollaborativeTextEditorMapper.mapCollaborativeTextEditorToResponse(textEditor);

		return dto;
	}

	@ApiOperation({ summary: 'Delete all etherpad sessions for user' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Delete('/delete-sessions')
	async deleteSessionsByUser(@CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.collaborativeTextEditorUc.deleteSessionsByUser(currentUser.userId);
	}
}
