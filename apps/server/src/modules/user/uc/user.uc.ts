import { Injectable } from '@nestjs/common';

import { UserRepo } from '@shared/repo';
import { EntityId, PermissionService, User } from '@shared/domain';

import { ChangeLanguageParams } from '../controller/dto';

@Injectable()
export class UserUC {
	constructor(private readonly userRepo: UserRepo, private readonly permissionService: PermissionService) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.save([user]);

		return true;
	}
}
