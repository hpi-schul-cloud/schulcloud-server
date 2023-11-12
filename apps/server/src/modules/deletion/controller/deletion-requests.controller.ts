import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForbiddenOperationError, ValidationError } from '@shared/common';
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
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Wrong authentication' })
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
		status: 200,
		type: DeletionRequestLogResponse,
		description: 'Return details of performed or planned deletion',
	})
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Wrong authentication' })
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
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Wrong authentication' })
	async cancelDeletionRequest(@Param('requestId') requestId: string) {
		return this.deletionRequestUc.deleteDeletionRequestById(requestId);
	}
}
