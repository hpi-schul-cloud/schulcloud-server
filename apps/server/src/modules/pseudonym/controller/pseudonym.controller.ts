import { Controller, Get, Query } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Page, Pseudonym } from '@shared/domain';
import { Authenticate } from '@src/modules/authentication/decorator/auth.decorator';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymMapper } from '../mapper/pseudonym.mapper';
import { PseudonymUc } from '../uc';
import { PseudonymResponse, PseudonymSearchListResponse, PseudonymSearchParams } from './dto';

// TODO: test it @igor
@ApiTags('Pseudonym')
@Authenticate('jwt')
@Controller('pseudonyms')
export class PseudonymController {
	constructor(private readonly pseudonymUc: PseudonymUc) {}

	@Get()
	@ApiFoundResponse({ description: 'Pseudonym has been found.', type: PseudonymSearchListResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns Pseudonym' })
	async getPseudonym(
		@Query() params: PseudonymSearchParams,
		@Query() pagination: PaginationParams
	): Promise<PseudonymSearchListResponse> {
		const searchQuery: PseudonymSearchQuery = PseudonymMapper.mapSearchParamsToSearchQuery(params);

		const pseudonym: Page<Pseudonym> = await this.pseudonymUc.findPseudonym(searchQuery, {
			pagination: {
				limit: pagination.limit,
				skip: pagination.skip,
			},
		});

		const pseudonymResponses: PseudonymResponse[] = PseudonymMapper.mapToResponseList(pseudonym.data);

		const response: PseudonymSearchListResponse = new PseudonymSearchListResponse(
			pseudonymResponses,
			pseudonymResponses.length,
			pagination.skip,
			pagination.limit
		);

		return response;
	}
}
