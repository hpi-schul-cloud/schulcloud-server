import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletionRequestPublicUc } from '../uc';
import { DeletionRequestBodyParams, DeletionRequestResponse } from './dto';

@ApiTags('DeletionRequest')
@JwtAuthentication()
@Controller('deletionRequestsPublic')
export class DeletionRequestPublicController {
	constructor(private readonly deletionRequestPublicUc: DeletionRequestPublicUc) {}

	@Post('')
	@HttpCode(202)
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 202,
		type: DeletionRequestResponse,
		description: 'Returns identifier of the deletion request and when deletion is planned at',
	})
	public createDeletionRequestPublic(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() deletionRequestBody: DeletionRequestBodyParams
	): Promise<DeletionRequestResponse> {
		return this.deletionRequestPublicUc.createUserDeletionRequest(currentUser, deletionRequestBody);
	}
}
