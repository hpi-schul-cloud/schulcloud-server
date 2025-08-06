import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LanguageType } from '@shared/domain/interface';
import type { EntityId } from '@shared/domain/types';
import { type UserConfig, UserService } from '../domain';
import type { ChangeLanguageParams } from './dto';

@Injectable()
export class UserUc {
	constructor(
		private readonly userService: UserService,
		private readonly configService: ConfigService<UserConfig, true>
	) {}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	public async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const result = await this.userService.patchLanguage(userId, params.language);
		if (!result) {
			throw new BadRequestException('Language could not be changed.');
		}

		return result;
	}
}
