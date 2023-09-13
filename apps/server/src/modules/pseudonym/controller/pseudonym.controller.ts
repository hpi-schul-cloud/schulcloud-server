import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Pseudonym } from '@shared/domain';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { PseudonymUc } from '../uc/pseudonym.uc';

@ApiTags('Pseudonym')
@Authenticate('jwt')
@Controller('pseudonyms')
export class PseudonymController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	/* @Get(':pseudonymId')
	@ApiFoundResponse({ description: 'Pseudonym has been found.', type: PseudonymResonse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns Pseudonym' })
	async findPseudonym(@Param() params: PseudonymIdParams): Promise<PseudonymResonse> {
		const pseudonym: Pseudonym = await this.pseudonymUc.findPseudonym(params.pseudonymId);

		const response: PseudonymResonse = // create and user mapper here

		return response;
	} */
}
