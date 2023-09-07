import { Body, Controller, ForbiddenException, Get, NotFoundException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { ObjectId } from 'mongodb';
import { FederalStateUC } from '../uc';
import { CreateFederalStateBodyParams } from './dto/create-federal-state.body.params';
import { FederalStateResponse } from './dto/federal-state.response';
import { FederalStateMapper } from './mapper';

@ApiTags('Federal-State')
@Authenticate('jwt')
@Controller('federal-states')
export class FederalStateController {
	constructor(private federalStateUC: FederalStateUC) {}

	@ApiOperation({
		summary: 'Returns all federal states',
	})
	@ApiResponse({ status: 200, type: FederalStateResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Get()
	async findAll(): Promise<FederalStateResponse[]> {
		const federalStates = await this.federalStateUC.findAllFederalStates();
		const federalStateResponse = federalStates.map((federalState) => FederalStateMapper.mapToResponse(federalState));
		return federalStateResponse;
	}

	// @Post(':federalStateName')
	// findFederalStateByName(@Param() federalStateName: string) {
	// 	return this.federalStateUC.findFederalStateByName(federalStateName);
	// }

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
