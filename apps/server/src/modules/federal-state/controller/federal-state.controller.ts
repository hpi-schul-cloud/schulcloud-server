import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FederalStateUC } from '../uc/federal-state.uc';
import { CreateFederalStateBodyParams } from './dto/create-federal-state.body.params';

@ApiTags('Federal-State')
// @Authenticate('jwt')
@Controller('federal-states')
export class FederalStateController {
	constructor(private federalStateUC: FederalStateUC) {}

	@Get()
	@ApiOperation({
		summary: 'Returns all federal states',
	})
	// @ApiResponse({ status: 200, type: AccountSearchListResponse, description: 'Returns a paged list of accounts.' })
	// @ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	// @ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'User is not a superhero or administrator.' })
	findAll() {
		return this.federalStateUC.findAll();
	}

	// @ApiResponse({
	// 	status: 201,
	// })
	// @ApiResponse({ status: 400, type: ApiValidationError })
	// @ApiResponse({ status: 403, type: ForbiddenException })
	// @ApiResponse({ status: 404, type: NotFoundException })
	@Post()
	@ApiOperation({ summary: 'Create a new element on a card.' })
	createElement(
		@Body() bodyParams: CreateFederalStateBodyParams
		// @CurrentUser() currentUser: ICurrentUser
	) {
		console.log(bodyParams);
		// const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId, type, toPosition);
		// const response = ContentElementResponseFactory.mapToResponse(element);

		// return response;
		return 'hi';
	}
}
