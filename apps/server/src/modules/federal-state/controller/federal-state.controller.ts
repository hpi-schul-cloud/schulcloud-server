import { Body, Controller, ForbiddenException, Get, NotFoundException, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { FederalStateEntity } from '../entity';
import { FederalStateUC } from '../uc/federal-state.uc';
import { CreateFederalStateBodyParams } from './dto/create-federal-state.body.params';
import { FederalStateResponse } from './dto/federal-state.response';

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
	findAll(): FederalStateResponse[] {
		const federalStates = [
			{
				id: '1',
				name: 'Bayern',
				abbreviation: 'BY',
				logoUrl:
					'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Coat_of_arms_of_Bavaria.svg/1200px-Coat_of_arms_of_Bavaria.svg.png',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		return federalStates;
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
