/* istanbul ignore file */
// TODO add tests to improve coverage

import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';

import { UserUC } from './uc/user.uc';
import { ResolvedUser } from './controller/dto';

@Injectable()
export class UserFacade {
	constructor(private readonly userUC: UserUC) {}

	async resolveUser(userId: EntityId): Promise<ResolvedUser> {
		const resolvedUser = await this.userUC.getUserWithPermissions(userId);
		return resolvedUser;
	}
}
