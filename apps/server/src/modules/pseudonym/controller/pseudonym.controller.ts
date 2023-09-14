import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Pseudonym } from '@shared/domain';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { PseudonymUc } from '../uc/pseudonym.uc';
import { PseudonymResponse } from './dto/pseudonym-response';
import { PseudonymIdParams } from './dto/pseudonym-id-params';
import { PseudonymResponseMapper } from '../mapper/pseudonym-response.mapper';

@ApiTags('Pseudonym')
@Authenticate('jwt')
@Controller('pseudonyms')
export class PseudonymController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	@Get(':pseudonymId')
	@ApiFoundResponse({ description: 'Pseudonym has been found.', type: PseudonymResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns Pseudonym' })
	async findPseudonym(@Param() params: PseudonymIdParams): Promise<PseudonymResponse> {
		const pseudonym: Pseudonym = await this.pseudonymUc.findPseudonym(params.pseudonymId);

		const response: PseudonymResponse = PseudonymResponseMapper.mapToResponse(pseudonym);

		return response;
	}
}
