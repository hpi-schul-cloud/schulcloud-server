import { Injectable } from '@nestjs/common';
import { EntityId, ResolvedUser } from '@shared/domain';
import { UserUC } from './uc/user.uc';
import { GroupUC } from './uc/group.uc';
import { ICurrentUser } from '../authentication/interface/jwt-payload';
import { FilteredCourseGroups } from './entity';

@Injectable()
export class UserFacade {
	constructor(private readonly userUC: UserUC, private readonly groupUC: GroupUC) {}

	async resolveUser(currentUser: ICurrentUser): Promise<ResolvedUser> {
		const resolvedUser = await this.userUC.getUserWithPermissions(currentUser);
		return resolvedUser;
	}

	async getCourseGroupsByUserId(userId: EntityId): Promise<FilteredCourseGroups> {
		const filteredCourseGroups = await this.groupUC.getCourseGroupsByUserId(userId);
		return filteredCourseGroups;
	}
}
