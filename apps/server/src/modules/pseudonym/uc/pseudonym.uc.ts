import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { LegacySchoolService } from '@modules/legacy-school';
import { RoleName } from '@modules/role';
import { InstanceFeature, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { Pseudonym } from '../repo';
import { PseudonymService } from '../service';

@Injectable()
export class PseudonymUc {
	constructor(
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: LegacySchoolService,
		private readonly schoolDomainService: SchoolService
	) {}

	public async resolvePseudonymForUser(requestingUserId: EntityId, pseudonym: string): Promise<Pseudonym> {
		const user: User = await this.authorizationService.getUserWithPermissions(requestingUserId);

		const foundPseudonym: Pseudonym | null = await this.pseudonymService.findOneByPseudonym(pseudonym);

		if (foundPseudonym === null) {
			throw new NotFoundLoggableException(Pseudonym.name, { pseudonym });
		}

		const pseudonymUserId: string = foundPseudonym.userId;
		const pseudonymUser: User = await this.authorizationService.getUserWithPermissions(pseudonymUserId);
		const pseudonymSchool = await this.schoolService.getSchoolById(pseudonymUser.school.id);

		this.authorizationService.checkPermission(user, pseudonymSchool, AuthorizationContextBuilder.read([]));

		return foundPseudonym;
	}

	public async resolveNameForUser(requestingUserId: EntityId, pseudonym: string): Promise<string> {
		const foundPseudonym = await this.resolvePseudonymForUser(requestingUserId, pseudonym);
		const requestingUser = await this.authorizationService.getUserWithPermissions(requestingUserId);

		if (requestingUser.getRoles().some((role) => role.name === RoleName.STUDENT)) {
			const school = await this.schoolDomainService.getSchoolById(requestingUser.school.id);
			if (!school.getProps().instanceFeatures?.has(InstanceFeature.IS_TEAM_CREATION_BY_STUDENTS_ENABLED)) {
				throw new ForbiddenException('The current user is not allowed to list other users!');
			}
		}

		const user = await this.authorizationService.getUserWithPermissions(foundPseudonym.userId);
		if (user.deletedAt && user.deletedAt < new Date()) {
			return '???';
		}

		return `${user.firstName} ${user.lastName}`;
	}
}
