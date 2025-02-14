import { XApiKeyAuthentication } from '@infra/auth-guard';
import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletionRequestUc } from '../uc';
import { DeletionRequestBodyParams, DeletionRequestLogResponse, DeletionRequestResponse } from './dto';

@ApiTags('DeletionRequest')
@XApiKeyAuthentication()
@Controller('deletionRequests')
export class DeletionRequestController {
	constructor(private readonly deletionRequestUc: DeletionRequestUc) {}

	@Post()
	@HttpCode(202)
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 202,
		type: DeletionRequestResponse,
		description: 'Returns identifier of the deletion request and when deletion is planned at',
	})
	public createDeletionRequests(
		@Body() deletionRequestBody: DeletionRequestBodyParams
	): Promise<DeletionRequestResponse> {
		return this.deletionRequestUc.createDeletionRequest(deletionRequestBody);
	}

	@Get(':requestId')
	@HttpCode(200)
	@ApiOperation({
		summary: 'Retrieving details of performed or planned deletion',
	})
	@ApiResponse({
		status: 200,
		type: DeletionRequestLogResponse,
		description: 'Return details of performed or planned deletion',
	})
	public getPerformedDeletionDetails(@Param('requestId') requestId: string): Promise<DeletionRequestLogResponse> {
		return this.deletionRequestUc.findById(requestId);
	}

	@Delete(':requestId')
	@HttpCode(204)
	@ApiOperation({
		summary: 'Canceling a deletion request',
	})
	@ApiResponse({
		status: 204,
	})
	public cancelDeletionRequest(@Param('requestId') requestId: string): Promise<void> {
		return this.deletionRequestUc.deleteDeletionRequestById(requestId);
	}
}
