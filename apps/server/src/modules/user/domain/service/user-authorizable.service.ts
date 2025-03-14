import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
	CurrentUserLoader,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { User } from '../../repo';
import { UserRepo } from '../../repo/user.repo';

@Injectable()
export class UserAuthorizableService implements AuthorizationLoaderServiceGeneric<User>, CurrentUserLoader {
	constructor(private readonly userRepo: UserRepo, private readonly injectionService: AuthorizationInjectionService) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.User, this);
		this.injectionService.injectCurrentUserLoader(this);
	}

	public async findById(id: EntityId): Promise<User> {
		const user = await this.userRepo.findById(id);

		return user;
	}

	public async loadCurrentUserWithPermissions(userId: EntityId): Promise<User> {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}
