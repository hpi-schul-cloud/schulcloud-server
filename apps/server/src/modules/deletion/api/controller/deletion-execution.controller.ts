import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Controller, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletionRequestUc } from '../uc';
import { DeletionExecutionParams } from './dto';

@ApiTags('DeletionExecution')
@XApiKeyAuthentication()
@Controller('deletionExecutions')
export class DeletionExecutionController {
	constructor(private readonly deletionRequestUc: DeletionRequestUc) {}

	@Post()
	@HttpCode(204)
	@ApiOperation({
		summary: 'Execute the deletion process',
	})
	@ApiResponse({
		status: 204,
	})
	public executeDeletions(@Query() deletionExecutionQuery: DeletionExecutionParams): Promise<void> {
		return this.deletionRequestUc.executeDeletionRequests(
			deletionExecutionQuery.limit,
			deletionExecutionQuery.runFailed
		);
	}
}
