import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DeletionRequestUc } from '../uc';
import { DeletionRequestLogResponse, DeletionRequestBodyProps, DeletionRequestResponse } from './dto';

@ApiTags('DeletionRequests')
@UseGuards(AuthGuard('api-key'))
@Controller('deletionRequests')
export class DeletionRequestsController {
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
	async createDeletionRequests(
		@Body() deletionRequestBody: DeletionRequestBodyProps
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
	async getPerformedDeletionDetails(@Param('requestId') requestId: string): Promise<DeletionRequestLogResponse> {
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
	async cancelDeletionRequest(@Param('requestId') requestId: string) {
		return this.deletionRequestUc.deleteDeletionRequestById(requestId);
	}
}
