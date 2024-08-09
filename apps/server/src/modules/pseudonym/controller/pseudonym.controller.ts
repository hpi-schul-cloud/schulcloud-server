import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Pseudonym } from '@shared/domain/domainobject';
import { PseudonymMapper } from '../mapper/pseudonym.mapper';
import { PseudonymUc } from '../uc';
import { PseudonymResponse } from './dto';
import { PseudonymParams } from './dto/pseudonym-params';

@ApiTags('Pseudonym')
@JwtAuthentication()
@Controller('pseudonyms')
export class PseudonymController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	@Get(':pseudonym')
	@ApiFoundResponse({ description: 'Pseudonym has been found.', type: PseudonymResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns the related user and tool information to a pseudonym' })
	async getPseudonym(
		@Param() params: PseudonymParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<PseudonymResponse> {
		const pseudonym: Pseudonym = await this.pseudonymUc.findPseudonymByPseudonym(currentUser.userId, params.pseudonym);

		const pseudonymResponse: PseudonymResponse = PseudonymMapper.mapToResponse(pseudonym);

		return pseudonymResponse;
	}
}
