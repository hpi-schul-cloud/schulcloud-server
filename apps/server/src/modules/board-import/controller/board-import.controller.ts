import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { BoardImportUc } from '../uc';
import { BoardImportJobResponse, BoardImportJobUrlParams, CreateBoardImportJobBodyParams } from './dto';
import { BoardImportJobResponseMapper } from './mapper';

@JwtAuthentication()
@ApiTags('board-import')
@Controller('board-import/jobs')
export class BoardImportController {
	constructor(private readonly boardImportUc: BoardImportUc) {}

	@Post()
	@ApiOperation({ summary: 'Start the import of a board from a share link.' })
	@ApiCreatedResponse({ type: BoardImportJobResponse })
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	@ApiForbiddenResponse({ description: 'The board import is disabled.' })
	public async startImport(
		@Body() bodyParams: CreateBoardImportJobBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardImportJobResponse> {
		const target = { type: bodyParams.targetType, id: bodyParams.targetId };
		const job = await this.boardImportUc.startImport(currentUser.userId, bodyParams.link, target);
		const response = BoardImportJobResponseMapper.mapToResponse(job);

		return response;
	}

	@Get(':jobId')
	@ApiOperation({ summary: 'Get the status of an import job that the current user started.' })
	@ApiOkResponse({ type: BoardImportJobResponse })
	@ApiBadRequestResponse({ type: ApiValidationError })
	@ApiUnauthorizedResponse({ description: 'Request is unauthorized.' })
	@ApiNotFoundResponse({ description: 'The job does not exist or belongs to another user.' })
	public async getJob(
		@Param() urlParams: BoardImportJobUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<BoardImportJobResponse> {
		const job = await this.boardImportUc.getJob(currentUser.userId, urlParams.jobId);
		const response = BoardImportJobResponseMapper.mapToResponse(job);

		return response;
	}
}
