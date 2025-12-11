import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';
import { HelpdeskUc } from './helpdesk.uc';

@ApiTags('Helpdesk')
@Controller('helpdesk')
export class HelpdeskController {
	constructor(private readonly helpdeskUc: HelpdeskUc) {}

	@Post('/problem')
	@JwtAuthentication()
	@ApiOperation({ summary: 'Create a new helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem created successfully' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	@UseInterceptors(FileFieldsInterceptor([{ name: 'file' }]))
	public async createProblem(
		@Body() body: HelpdeskProblemCreateParams,
		@CurrentUser() currentUser: ICurrentUser,
		@UploadedFiles() file?: { file?: Express.Multer.File[] }
	): Promise<void> {
		body.files = file?.file;

		await this.helpdeskUc.createHelpdeskProblem(currentUser.userId, body);
	}

	@Post('/wish')
	@JwtAuthentication()
	@ApiOperation({ summary: 'Create a new helpdesk wish' })
	@ApiOkResponse({ description: 'Helpdesk wish created successfully' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	public async createWish(
		@Body() body: HelpdeskWishCreateParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.helpdeskUc.createHelpdeskWish(currentUser.userId, body);
	}
}
