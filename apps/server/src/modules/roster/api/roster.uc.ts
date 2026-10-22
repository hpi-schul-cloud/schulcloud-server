import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { FeathersRosterService } from '../service';
import { PseudonymService } from '@modules/pseudonym';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Pseudonym } from '@modules/pseudonym/repo';

interface UserGroupResponseItem {
	group_id: string;
	name: string;
	student_count: number;
}

export interface UserGroupsResponse {
	data: {
		groups: UserGroupResponseItem[];
	};
}

@Injectable()
export class RosterUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly feathersRosterService: FeathersRosterService,
		private readonly pseudonymService: PseudonymService
	) {}

	public async getUserGroups(userId: EntityId, pseudonym: string, oauth2ClientId: string): Promise<UserGroupsResponse> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkOneOfPermissions(user, [Permission.ROOM_LIST_CONTENT, Permission.COURSE_VIEW]);
		const loadedPseudonym = await this.pseudonymService.findOneByPseudonym(pseudonym);

		if (!loadedPseudonym) {
			throw new NotFoundLoggableException(Pseudonym.name, { pseudonym });
		}

		const { userId: userIdPseudonym } = loadedPseudonym;
		if (userIdPseudonym !== userId) {
			throw new UnauthorizedException('You are not allowed to access this pseudonym');
		}

		const userGroups = await this.feathersRosterService.getUserGroups(pseudonym, oauth2ClientId);

		return userGroups;
	}
}
