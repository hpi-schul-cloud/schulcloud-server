import { Injectable } from '@nestjs/common';
import { IFindOptions, Page, Pseudonym, User } from '@shared/domain';
import { PseudonymSearchQuery } from '../domain';
import { PseudonymService } from '../service';
import { ICurrentUser } from '../../authentication';
import { Action, AuthorizationService } from '../../authorization';

@Injectable()
export class PseudonymUc {
	constructor(
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findPseudonym(
		currentUser: ICurrentUser,
		query: PseudonymSearchQuery,
		options: IFindOptions<Pseudonym>
	): Promise<Page<Pseudonym>> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);

		const pseudonymPage: Page<Pseudonym> = await this.pseudonymService.findPseudonym(query, options);

		const pseudonymUserId: string = pseudonymPage.data[0].userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const { school } = pseudonymUser;

		const context = { action: Action.read, requiredPermissions: [] };
		this.authorizationService.checkPermission(user, school, context);

		return pseudonymPage;
	}
}
