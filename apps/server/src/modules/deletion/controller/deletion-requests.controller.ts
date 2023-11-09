import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForbiddenOperationError, ValidationError } from '@shared/common';
import { AuthGuard } from '@nestjs/passport';
import { DeletionRequestUc } from '../uc/deletion-request.uc';
import { DeletionRequestResponse } from './dto/deletion-request.response';
import { DeletionRequestBodyProps } from './dto/deletion-request.body.params';
import { DeletionRequestLogResponse } from './dto';

@ApiTags('DeletionRequests')
@UseGuards(AuthGuard('api-key'))
@Controller('deletionRequests')
export class DeletionRequestsController {
	constructor(private readonly deletionRequestUc: DeletionRequestUc) {}

	@Post()
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 202,
		type: DeletionRequestResponse,
		description: 'Returns identifier of the deletion request and when deletion is planned at',
	})
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	async createDeletionRequests(
		@Body() deletionRequestBody: DeletionRequestBodyProps
	): Promise<DeletionRequestResponse> {
		return this.deletionRequestUc.createDeletionRequest(deletionRequestBody);
	}

	@Get(':requestId')
	@ApiOperation({
		summary: 'Retrieving details of performed or planned deletion',
	})
	@ApiResponse({
		status: 202,
		type: DeletionRequestLogResponse,
		description: 'Return details of performed or planned deletion',
	})
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	async getPerformedDeletionDetails(@Param('requestId') requestId: string): Promise<DeletionRequestLogResponse> {
		return this.deletionRequestUc.findById(requestId);
	}

	@Get(':requestId')
	@ApiOperation({
		summary: 'Canceling a deletion request',
	})
	@ApiResponse({
		status: 204,
	})
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	async cancelDeletionRequest(@Param('requestId') requestId: string) {
		return this.deletionRequestUc.deleteDeletionRequestById(requestId);
	}
}
