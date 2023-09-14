import { Body, Controller, ForbiddenException, Get, NotFoundException, Post } from '@nestjs/common';
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
		const federalStateResponse = federalStates.map((federalState) => FederalStateMapper.mapToResponse(federalState));
		return federalStateResponse;
	}

	@Post()
	createFederalState(@Body() createFederalStateBodyParams: CreateFederalStateBodyParams) {
		return null;
	}
}
