import { PseudonymResponse } from '../controller/dto';
import { Pseudonym } from '../repo';

export class PseudonymMapper {
	static mapToResponse(pseudonym: Pseudonym): PseudonymResponse {
		const response: PseudonymResponse = new PseudonymResponse({
			id: pseudonym.id,
			toolId: pseudonym.toolId,
			userId: pseudonym.userId,
		});

		return response;
	}
}
