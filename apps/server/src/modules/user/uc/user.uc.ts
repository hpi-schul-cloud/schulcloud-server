import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { UserService } from '@src/modules/user/service/user.service';
import { ChangeLanguageParams } from '../controller/dto';

@Injectable()
export class UserUc {
	constructor(private readonly userService: UserService, private readonly authorizationService: AuthorizationService) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const permissions = this.authorizationService.resolvePermissions(user);

		return [user, permissions];
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const result = await this.userService.patchLanguage(userId, params.language);

		return result;
	}
}
