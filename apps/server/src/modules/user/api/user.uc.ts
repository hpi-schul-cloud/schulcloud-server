import { Injectable } from '@nestjs/common';
import type { EntityId } from '@shared/domain/types';
import { UserService } from '../domain';
import type { ChangeLanguageParams } from './dto';

@Injectable()
export class UserUc {
	constructor(private readonly userService: UserService) {}

	public async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const result = await this.userService.patchLanguage(userId, params.language);

		return result;
	}
}
