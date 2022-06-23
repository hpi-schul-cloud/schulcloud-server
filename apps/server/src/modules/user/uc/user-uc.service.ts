import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId, LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

// TODO Refactoring https://ticketsystem.dbildungscloud.de/browse/N21-169 create service layer
@Injectable()
export class UserUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>
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

	async save(user: UserDto): Promise<void> {
		if (user.id) {
			const entity = await this.userRepo.findById(user.id);
			const fromDto = UserMapper.mapFromDtoToEntity(user);
			return this.userRepo.save(UserMapper.mapFromEntityToEntity(entity, fromDto));
		}
		return this.userRepo.save(UserMapper.mapFromDtoToEntity(user));
	}
}
