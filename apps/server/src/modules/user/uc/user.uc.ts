import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LanguageType, User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { UserRepo } from '@shared/repo/user/user.repo';
import { ChangeLanguageParams } from '../controller/dto/user.params';
import { IUserConfig } from '../interfaces/user-config';

@Injectable()
export class UserUc {
	constructor(private readonly userRepo: UserRepo, private readonly configService: ConfigService<IUserConfig, true>) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = user.resolvePermissions();

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
