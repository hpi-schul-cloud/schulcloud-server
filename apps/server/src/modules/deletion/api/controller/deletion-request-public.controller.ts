import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { BadRequestException, Controller, Delete, HttpCode, HttpException, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletionRequestPublicUc } from '../uc';
import { DeletionRequestParams } from './dto';

@ApiTags('DeletionRequest')
@JwtAuthentication()
@Controller('deletionRequestsPublic')
export class DeletionRequestPublicController {
	constructor(private readonly deletionRequestPublicUc: DeletionRequestPublicUc) {}

	@Delete('')
	@HttpCode(204)
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 201,
		description: 'Users deletion requests created successfully',
	})
	@ApiResponse({
		status: 207,
		description: 'Partial success - Some deletion requests could not be processed',
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - All deletion requests failed',
	})
	public async createDeletionRequestPublic(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() params: DeletionRequestParams
	): Promise<void> {
		const errors = await this.deletionRequestPublicUc.createUserListDeletionRequest(currentUser, params.ids);

		if (errors.length === params.ids.length) {
			throw new BadRequestException();
		} else if (errors.length > 0) {
			throw new HttpException(
				{
					status: 207,
					message: 'Partial success: Some deletion requests could not be processed.',
				},
				207
			);
		}
	}
}
