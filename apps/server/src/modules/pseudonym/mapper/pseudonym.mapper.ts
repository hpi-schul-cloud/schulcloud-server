import { Pseudonym } from '@shared/domain';
import { PseudonymResponse, PseudonymSearchParams } from '../controller/dto';
import { PseudonymSearchQuery } from '../domain';

export class PseudonymMapper {
	static mapToResponse(pseudonym: Pseudonym): PseudonymResponse {
		const response: PseudonymResponse = new PseudonymResponse({
			id: pseudonym.id,
			toolId: pseudonym.toolId,
			userId: pseudonym.userId,
		});

		return response;
	}

	static mapToResponseList(pseudonyms: Pseudonym[]): PseudonymResponse[] {
		const response: PseudonymResponse[] = pseudonyms.map((pseudonym: Pseudonym) => this.mapToResponse(pseudonym));

		return response;
	}

	static mapSearchParamsToSearchQuery(params: PseudonymSearchParams): PseudonymSearchQuery {
		const query: PseudonymSearchQuery = {
			pseudonym: params.pseudonym,
			userId: params.userId,
			toolId: params.toolId,
		};
		return query;
	}
}
