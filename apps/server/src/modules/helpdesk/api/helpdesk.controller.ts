import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Headers,
	ParseFilePipeBuilder,
	Post,
	UploadedFiles,
	UseInterceptors
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { IResult, UAParser } from 'ua-parser-js';
import { HelpdeskProblemCreateParams, HelpdeskWishCreateParams } from './dto';
import { HelpdeskUc } from './helpdesk.uc';

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
	@UseInterceptors(FileFieldsInterceptor([{ name: 'file' }]))
	public async createProblem(
		@Body() body: HelpdeskProblemCreateParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Headers('user-agent') userAgentHeader: string,
		@UploadedFiles(
			new ParseFilePipeBuilder()
				.addFileTypeValidator({
					fileType: /(jpg|jpeg|png|mp4|pdf|docx)$/,
				})
				.addMaxSizeValidator({
					maxSize: 5000 * 1024, // 5 MB
					message: (maxSize: number) => `File size should not exceed ${maxSize} bytes.`,
				})
				.build({
					fileIsRequired: false,
				})
		)
		file?: { file?: Express.Multer.File[] }
	): Promise<void> {
		const userAgent: IResult = this.parseUserAgent(userAgentHeader);

		await this.helpdeskUc.createHelpdeskProblem(currentUser.userId, body, file?.file, userAgent);
	}

	@Post('/wish')
	@ApiOperation({ summary: 'Create a new helpdesk wish' })
	@ApiOkResponse({ description: 'Helpdesk wish created successfully' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.', type: ApiValidationError })
	@UseInterceptors(FileFieldsInterceptor([{ name: 'file' }]))
	public async createWish(
		@Body() body: HelpdeskWishCreateParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Headers('user-agent') userAgentHeader: string,
		@UploadedFiles(
			new ParseFilePipeBuilder()
				.addFileTypeValidator({
					fileType: /(jpg|jpeg|png|mp4|pdf|docx)$/,
				})
				.addMaxSizeValidator({
					maxSize: 5000 * 1024, // 5 MB
					message: (maxSize: number) => `File size should not exceed ${maxSize} bytes.`,
				})
				.build({
					fileIsRequired: false,
				})
		)
		file?: { file?: Express.Multer.File[] }
	): Promise<void> {
		const userAgent: IResult = this.parseUserAgent(userAgentHeader);

		await this.helpdeskUc.createHelpdeskWish(currentUser.userId, body, file?.file, userAgent);
	}

	private parseUserAgent(userAgentHeader: string): IResult {
		const ua = new UAParser(userAgentHeader);

		return ua.getResult();
	}
}
