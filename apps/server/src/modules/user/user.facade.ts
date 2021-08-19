/* istanbul ignore file */
// TODO add tests to improve coverage

import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';

import { UserUC } from './uc/user.uc';
import { ResolvedUser } from './controller/dto';

@Injectable()
export class UserFacade {
	constructor(private readonly userUC: UserUC) {}

	async resolveUser(currentUser: ICurrentUser): Promise<ResolvedUser> {
		const resolvedUser = await this.userUC.getUserWithPermissions(currentUser);
		return resolvedUser;
	}
}
