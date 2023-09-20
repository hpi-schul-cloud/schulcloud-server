import { Injectable } from '@nestjs/common';
import { LegacySchoolDo, Page, Pseudonym, User } from '@shared/domain';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ICurrentUser } from '@src/modules/authentication';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacySchoolService } from '@src/modules/legacy-school';
import { PseudonymService } from '../service';

@Injectable()
export class PseudonymUc {
	constructor(
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService
	) {}

	async findPseudonymByPseudonym(currentUser: ICurrentUser, pseudonym: string): Promise<Pseudonym> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);

		const pseudonymPage: Page<Pseudonym> = await this.pseudonymService.findPseudonym({ pseudonym }, {});

		if (pseudonymPage.data.length < 1) {
			throw new NotFoundLoggableException(Pseudonym.name, 'pseudonym', pseudonym);
		}

		const pseudonymUserId: string = pseudonymPage.data[0].userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const pseudonymSchool: LegacySchoolDo = await this.schoolService.getSchoolById(pseudonymUser.school.id);

		this.authorizationService.checkPermission(user, pseudonymSchool, AuthorizationContextBuilder.read([]));

		const foundPseudonym = pseudonymPage.data[0];

		return foundPseudonym;
	}
}
