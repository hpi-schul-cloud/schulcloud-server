import { Pseudonym } from '@shared/domain';
import { PseudonymResponse } from '../controller/dto/pseudonym-response';

export class PseudonymResponseMapper {
	static mapToResponse(pseudonym: Pseudonym): PseudonymResponse {
		const response: PseudonymResponse = new PseudonymResponse({
			id: pseudonym.id,
			toolId: pseudonym.toolId,
			userId: pseudonym.userId,
		});

		return response;
	}
}
