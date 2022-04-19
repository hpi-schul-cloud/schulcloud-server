import { Injectable, BadRequestException } from '@nestjs/common';

import { UserRepo } from '@shared/repo';
import { EntityId, PermissionService, User, LanguageType } from '@shared/domain';

import { ChangeLanguageParams } from '../controller/dto';
import { UserConfig } from '../user.config';

@Injectable()
export class UserUC {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly userConfig: UserConfig
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.userConfig.getAvailableLanguages().includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		this.checkAvaibleLanguages(params.language);
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.save(user);

		return true;
	}
}
