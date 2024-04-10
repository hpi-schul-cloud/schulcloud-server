import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, ForbiddenException, NotFoundException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { CollaborativeTextEditorUc } from '../uc/collaborative-text-editor.uc';
import { CreateCollaborativeTextEditorBodyParams } from './dto/create-collaborative-text-editor.body.params';

@ApiTags('CollaborativeTextEditor')
@Authenticate('jwt')
@Controller('collaborative-text-editor')
export class CollaborativeTextEditorController {
	constructor(private readonly collaborativeTextEditorUc: CollaborativeTextEditorUc) {}

	@ApiOperation({ summary: 'Create a new CollaborativeTextEditor.' })
	//@ApiResponse({ status: 201, type: CreateCollaborativeTextEditorResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post()
	async createCollaborativeTextEditor(
		@Body() collaborativeTextEditorParams: CreateCollaborativeTextEditorBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.collaborativeTextEditorUc.createCollaborativeTextEditor(
			currentUser.userId,
			collaborativeTextEditorParams
		);
	}
}
