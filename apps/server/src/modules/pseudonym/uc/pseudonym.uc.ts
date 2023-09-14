import { Pseudonym } from '@shared/domain';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { PseudonymService } from '../service';

export class PseudonymUc {
	constructor(private readonly pseudonymService: PseudonymService) {}

	async findPseudonym(pseudonymId: string): Promise<Pseudonym> {
		const foundPseudonym: Pseudonym | null = await this.pseudonymService.findPseudonymByPseudonym(pseudonymId);

		if (!foundPseudonym) {
			throw new NotFoundLoggableException(Pseudonym.name, 'pseudonym', pseudonymId);
		}

		return foundPseudonym;
	}
}
