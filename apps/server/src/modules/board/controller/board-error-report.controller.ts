import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { BoardErrorReportUc } from '../uc/board-error-report.uc';
import { BoardErrorReportBodyParams } from './dto/board/board-error-report.body.params';

@ApiTags('BoardErrorReport')
@JwtAuthentication()
@Controller('report-board-error')
export class BoardErrorReportController {
	constructor(private readonly boardErrorReportUC: BoardErrorReportUc) {}

	@ApiOperation({ summary: 'Report a board related error.' })
	@ApiResponse({ status: 201, description: 'Error reported' })
	@ApiResponse({ status: 400, description: 'Validation error', type: ApiValidationError })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Post()
	public async reportError(
		@Body() bodyParams: BoardErrorReportBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardErrorReportUC.reportError(currentUser.userId, bodyParams);
	}
}
