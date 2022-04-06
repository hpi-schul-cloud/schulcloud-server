import { Injectable, BadRequestException, Inject } from '@nestjs/common';

import { UserRepo } from '@shared/repo';
import { EntityId, PermissionService, User, LanguageType } from '@shared/domain';

import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

@Injectable()
export class UserUC {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		@Inject('User_Config') private readonly userConfig: IUserConfig
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.userConfig.getAviableLanguages().includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		this.checkAvaibleLanguages(params.language);
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.persistAndFlush(user);

		return true;
	}
}
