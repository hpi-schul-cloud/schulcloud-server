import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LanguageType } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { USER_REPO, UserConfig } from '../domain';
import { User, UserMikroOrmRepo } from '../repo';
import { ChangeLanguageParams } from './dto';

@Injectable()
export class UserUc {
	constructor(
		@Inject(USER_REPO) private readonly userRepo: UserMikroOrmRepo,
		private readonly configService: ConfigService<UserConfig, true>
	) {}

	public async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	public async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		this.checkAvaibleLanguages(params.language);
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.save(user);

		return true;
	}
}
