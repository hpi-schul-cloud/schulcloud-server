import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { LegacySchoolDo, Pseudonym } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { PseudonymService } from '../service';

@Injectable()
export class PseudonymUc {
	constructor(
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService
	) {}

	async findPseudonymByPseudonym(userId: EntityId, pseudonym: string): Promise<Pseudonym> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		const foundPseudonym: Pseudonym | null = await this.pseudonymService.findPseudonymByPseudonym(pseudonym);

		if (foundPseudonym === null) {
			throw new NotFoundLoggableException(Pseudonym.name, { pseudonym });
		}

		const pseudonymUserId: string = foundPseudonym.userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const pseudonymSchool: LegacySchoolDo = await this.schoolService.getSchoolById(pseudonymUser.school.id);

		this.authorizationService.checkPermission(user, pseudonymSchool, AuthorizationContextBuilder.read([]));

		return foundPseudonym;
	}
}
