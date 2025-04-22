import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletionRequestUc } from '../uc';
import { DeletionExecutionParams, DeletionItemsParams } from './dto';
import { EntityId } from '@shared/domain/types';

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
	public executeDeletions(@Body() deletionExecutionQuery: DeletionExecutionParams): Promise<void> {
		return this.deletionRequestUc.executeDeletionRequests(deletionExecutionQuery.ids);
	}

	@Get()
	@HttpCode(200)
	@ApiOperation({
		summary: 'Get deletion requests that are pending execution',
	})
	@ApiResponse({
		status: 200,
		type: Array<string>,
		isArray: true,
		description: 'Returns deletion requests ids that are waiting execution',
	})
	public findAllItemsToExecute(@Query() deletionItemsQuery: DeletionItemsParams): Promise<EntityId[]> {
		return this.deletionRequestUc.findAllItemsToExecute(deletionItemsQuery.limit, deletionItemsQuery.runFailed);
	}
}
