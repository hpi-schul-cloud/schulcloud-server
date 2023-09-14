import { Injectable } from '@nestjs/common';
import { IFindOptions, Page, Pseudonym } from '@shared/domain';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymService } from '../service';

@Injectable()
export class PseudonymUc {
	constructor(private readonly pseudonymService: PseudonymService) {}

	async findPseudonym(query: PseudonymSearchQuery, options: IFindOptions<Pseudonym>): Promise<Page<Pseudonym>> {
		// todo: do we need permissions checks? @igor
		// is user at school?
		const pseudonymPage: Page<Pseudonym> = await this.pseudonymService.findPseudonym(query, options);

		return pseudonymPage;
	}
}
