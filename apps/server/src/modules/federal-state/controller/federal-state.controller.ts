import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { FederalStateUC } from '../uc';
import { CreateFederalStateBodyParams, FederalStateResponse } from './dto';
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
	async findAll(@CurrentUser() currentUser: ICurrentUser): Promise<FederalStateResponse[]> {
		const federalStates = await this.federalStateUC.findAllFederalStates(currentUser.userId);
		const federalStateResponse = federalStates.map((federalState) =>
			FederalStateMapper.mapFederalStateToResponse(federalState)
		);
		return federalStateResponse;
	}

	@Post()
	async createFederalState(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createFederalStateBodyParams: CreateFederalStateBodyParams
	) {
		const federalStateDo = await this.federalStateUC.createFederalState(
			createFederalStateBodyParams,
			currentUser.userId
		);
		const federalStateResponse = FederalStateMapper.mapFederalStateToResponse(federalStateDo);
		return federalStateResponse;
	}

	@ApiOperation({ summary: 'Deletes an federal state with given id. Superhero role is REQUIRED.' })
	@ApiResponse({ status: 200, type: FederalStateResponse, description: 'Returns deleted federal state.' })
	@ApiResponse({ status: 400, type: ApiValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenException, description: 'User is not a superhero.' })
	@ApiResponse({ status: 404, type: NotFoundException, description: 'federal state is not found.' })
	@Delete(':id')
	async deleteFederalState(@CurrentUser() currentUser: ICurrentUser, @Param('id') id: string) {
		const federalStateDo = await this.federalStateUC.deleteFederalState(id, currentUser.userId);
		const federalStateResponse = FederalStateMapper.mapFederalStateToResponse(federalStateDo);
		return federalStateResponse;
	}
}
