import { Injectable } from '@nestjs/common';
import { UserUC } from './uc/user.uc';
import { ICurrentUser } from '../authentication/interface/jwt-payload';
import { ResolvedUser } from './controller/dto';

@Injectable()
export class UserFacade {
	constructor(private readonly userUC: UserUC) {}

	async resolveUser(currentUser: ICurrentUser): Promise<ResolvedUser> {
		const resolvedUser = await this.userUC.getUserWithPermissions(currentUser);
		return resolvedUser;
	}
}
