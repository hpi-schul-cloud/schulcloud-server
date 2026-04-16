import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Headers, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { IResult, UAParser } from 'ua-parser-js';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';
import { HelpdeskUc } from './helpdesk.uc';
import { HelpdeskFileValidationPipe } from './pipe/helpdesk-file-validation.pipe';

@ApiTags('Helpdesk')
@Controller('helpdesk')
@JwtAuthentication()
export class HelpdeskController {
	constructor(private readonly helpdeskUc: HelpdeskUc) {}

	@Post('/problem')
	@ApiOperation({ summary: 'Create a new helpdesk problem' })
	@ApiOkResponse({ description: 'Helpdesk problem created successfully' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	@UseInterceptors(FilesInterceptor('files'))
	public async createProblem(
		@Body() body: HelpdeskProblemCreateParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Headers('user-agent') userAgentHeader: string,
		@UploadedFiles(new HelpdeskFileValidationPipe())
		files?: Express.Multer.File[]
	): Promise<void> {
		const userAgent = this.parseUserAgent(userAgentHeader, body.consent);

		await this.helpdeskUc.createHelpdeskProblem(currentUser.userId, body, files, userAgent);
	}

	@Post('/wish')
	@ApiOperation({ summary: 'Create a new helpdesk wish' })
	@ApiOkResponse({ description: 'Helpdesk wish created successfully' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	@UseInterceptors(FilesInterceptor('files'))
	public async createWish(
		@Body() body: HelpdeskWishCreateParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Headers('user-agent') userAgentHeader: string,
		@UploadedFiles(new HelpdeskFileValidationPipe())
		files?: Express.Multer.File[]
	): Promise<void> {
		const userAgent = this.parseUserAgent(userAgentHeader, body.consent);

		await this.helpdeskUc.createHelpdeskWish(currentUser.userId, body, files, userAgent);
	}

	private parseUserAgent(userAgentHeader: string, consent?: boolean): IResult | undefined {
		if (!consent) {
			return undefined;
		}
		const ua = new UAParser(userAgentHeader);

		return ua.getResult();
	}
}
