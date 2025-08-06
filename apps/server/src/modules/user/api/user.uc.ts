import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LanguageType } from '@shared/domain/interface';
import type { EntityId } from '@shared/domain/types';
import { type UserConfig, UserService } from '../domain';
import type { ChangeLanguageParams } from './dto';

@Injectable()
export class UserUc {
	constructor(private readonly userService: UserService) {}

	public async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const result = await this.userService.patchLanguage(userId, params.language);

		return result;
	}
}
