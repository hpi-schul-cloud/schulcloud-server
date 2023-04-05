import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { UserService } from '@src/modules/user/service/user.service';
import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

@Injectable()
export class UserUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly userService: UserService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.authorizationService.resolvePermissions(user);

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
