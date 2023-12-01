import { Controller, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeletionRequestUc } from '../uc';
import { DeletionExecutionParams } from './dto';

@ApiTags('DeletionExecutions')
@UseGuards(AuthGuard('api-key'))
@Controller('deletionExecutions')
export class DeletionExecutionsController {
	constructor(private readonly deletionRequestUc: DeletionRequestUc) {}

	@Post()
	@HttpCode(204)
	@ApiOperation({
		summary: 'Execute the deletion process',
	})
	@ApiResponse({
		status: 204,
	})
	async executeDeletions(@Query() deletionExecutionQuery: DeletionExecutionParams) {
		return this.deletionRequestUc.executeDeletionRequests(deletionExecutionQuery.limit);
	}
}
