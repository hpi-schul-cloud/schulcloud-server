// Needs deep import because of cyclic dependency - will be solved in BC-9169
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
	CurrentUserLoader,
} from '@modules/authorization/domain';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { User, UserRepo } from '../repo';

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
