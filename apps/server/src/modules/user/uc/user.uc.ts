import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserService } from '@src/modules/user/service/user.service';
import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

@Injectable()
export class UserUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly userService: UserService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(settedLanguage)) {
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
