import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Page, Pseudonym } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { PseudonymMapper } from '../mapper/pseudonym.mapper';
import { PseudonymUc } from '../uc';
import { PseudonymResponse } from './dto';
import { PseudonymParams } from './dto/pseudonym-params';
import { ICurrentUser } from '../../authentication';

// TODO: test it @igor
@ApiTags('Pseudonym')
@Authenticate('jwt')
@Controller('pseudonyms')
export class PseudonymController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	@Get(':pseudonym')
	@ApiFoundResponse({ description: 'Pseudonym has been found.', type: PseudonymResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns Pseudonym' })
	async getPseudonym(
		@Param() params: PseudonymParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<PseudonymResponse> {
		const page: Page<Pseudonym> = await this.pseudonymUc.findPseudonym(
			currentUser,
			{ pseudonym: params.pseudonym },
			{}
		);

		const pseudonymResponses: PseudonymResponse[] = PseudonymMapper.mapToResponseList(page.data);

		return pseudonymResponses[0];
	}
}
