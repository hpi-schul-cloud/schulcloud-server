import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { ForbiddenOperationError, ValidationError } from '@shared/common';
import { DeletionRequestUc } from '../uc/deletion-request.uc';
import { DeletionExecutionParams } from './dto';

@ApiTags('DeletionExecutions')
@Authenticate('jwt')
@Controller('deletionExecutions')
export class AccountController {
	constructor(private readonly deletionRequestUc: DeletionRequestUc) {}

	@Post()
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 204,
	})
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	async executeDeletions(@Query() deletionExecutionQuery: DeletionExecutionParams) {
		return this.deletionRequestUc.executeDeletionRequests(deletionExecutionQuery.limit);
	}
}
