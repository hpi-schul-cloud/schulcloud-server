import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId, LanguageType, PermissionService, User } from '@shared/domain';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserService } from '@src/modules/user/service/user.service';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUcMapper } from '@src/modules/user/mapper/user.uc.mapper';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { ConfigService } from '@nestjs/config';
import { UserRepo } from '@shared/repo';
import { ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';

@Injectable()
export class UserUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly userService: UserService,
		private readonly roleUc: RoleUc
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
		const promise: Promise<void> = this.userService.createOrUpdate(user);
		return promise;
	}

	async saveProvisioningUserOutputDto(user: ProvisioningUserOutputDto): Promise<void> {
		const roleDtos = await this.roleUc.findByNames(user.roleNames);
		const roleIds: EntityId[] = roleDtos.map((role: RoleDto) => role.id as EntityId);
		return this.userService.createOrUpdate(UserUcMapper.mapFromProvisioningUserOutputDtoToUserDto(user, roleIds));
	}
}
