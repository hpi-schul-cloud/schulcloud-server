// Needs deep import because of cyclic dependency - will be solved in BC-9169
import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization/domain';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { User, UserRepo } from '../repo';

@Injectable()
export class UserAuthorizableService implements AuthorizationLoaderServiceGeneric<User> {
	constructor(private readonly userRepo: UserRepo, private readonly injectionService: AuthorizationInjectionService) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.User, this);
	}

	public async findById(id: EntityId): Promise<User> {
		const course = await this.userRepo.findById(id);

		return course;
	}
}
