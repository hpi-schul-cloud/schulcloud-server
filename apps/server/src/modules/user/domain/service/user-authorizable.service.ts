import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
	CurrentUserLoader,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { User, UserMikroOrmRepo } from '../../repo';
import { UserDo } from '../do';
import { UserService } from './user.service';

@Injectable()
export class UserAuthorizableService implements AuthorizationLoaderServiceGeneric<UserDo>, CurrentUserLoader {
	constructor(
		private readonly userRepo: UserMikroOrmRepo,
		private readonly userService: UserService,
		private readonly injectionService: AuthorizationInjectionService
	) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.User, this);
		this.injectionService.injectCurrentUserLoader(this);
	}

	public async findById(id: EntityId): Promise<UserDo> {
		const user = await this.userService.findById(id);

		return user;
	}

	public async loadCurrentUserWithPermissions(userId: EntityId): Promise<User> {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}
