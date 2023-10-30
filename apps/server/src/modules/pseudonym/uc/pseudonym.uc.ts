import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception/not-found.loggable-exception';
import { LegacySchoolDo } from '@shared/domain/domainobject/legacy-school.do';
import { Pseudonym } from '@shared/domain/domainobject/pseudonym.do';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { LegacySchoolService } from '@src/modules/legacy-school/service/legacy-school.service';
import { PseudonymService } from '../service/pseudonym.service';

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
			throw new NotFoundLoggableException(Pseudonym.name, 'pseudonym', pseudonym);
		}

		const pseudonymUserId: string = foundPseudonym.userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const pseudonymSchool: LegacySchoolDo = await this.schoolService.getSchoolById(pseudonymUser.school.id);

		this.authorizationService.checkPermission(user, pseudonymSchool, AuthorizationContextBuilder.read([]));

		return foundPseudonym;
	}
}
