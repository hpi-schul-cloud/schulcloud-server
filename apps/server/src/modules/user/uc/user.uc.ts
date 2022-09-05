import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { UserService } from '@src/modules/user/service/user.service';
import { ChangeLanguageParams } from '../controller/dto';

@Injectable()
export class UserUc {
	constructor(private readonly userService: UserService) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		return this.userService.me(userId);
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const result = await this.userService.patchLanguage(userId, params.language);

		return result;
	}
}
