import { Injectable } from '@nestjs/common';
import { Page, Pseudonym, School, User } from '@shared/domain';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { PseudonymService } from '../service';
import { ICurrentUser } from '../../authentication';
import { AuthorizationContextBuilder, AuthorizationService } from '../../authorization';

@Injectable()
export class PseudonymUc {
	constructor(
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findPseudonymByPseudonym(currentUser: ICurrentUser, pseudonym: string): Promise<Pseudonym> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);

		const pseudonymPage: Page<Pseudonym> = await this.pseudonymService.findPseudonym({ pseudonym }, {});

		if (pseudonymPage.data.length < 1) {
			throw new NotFoundLoggableException(Pseudonym.name, 'pseudonym', pseudonym);
		}

		const pseudonymUserId: string = pseudonymPage.data[0].userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const pseudonymSchool: School = pseudonymUser.school;

		this.authorizationService.checkPermission(user, pseudonymSchool, AuthorizationContextBuilder.read([]));

		const foundPseudonym = pseudonymPage.data[0];

		return foundPseudonym;
	}
}
