import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserService } from '@src/modules/user/service/user.service';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUcMapper } from '@src/modules/user/mapper/user.uc.mapper';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { ChangeLanguageParams } from '../controller/dto';

@Injectable()
export class UserUc {
	constructor(private readonly userService: UserService, private readonly roleUc: RoleUc) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const promise: Promise<[User, string[]]> = this.userService.me(userId);
		return promise;
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		const promise: Promise<boolean> = this.userService.patchLanguage(userId, params.language);
		return promise;
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
