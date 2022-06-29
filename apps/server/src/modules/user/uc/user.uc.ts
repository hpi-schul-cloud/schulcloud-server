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
		return this.userService.me(userId);
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		return this.userService.patchLanguage(userId, params.language);
	}

	async save(user: UserDto): Promise<void> {
		return this.userService.save(user);
	}

	async saveProvisioningUserOutputDto(user: ProvisioningUserOutputDto): Promise<void> {
		const roleDtos = await this.roleUc.findByNames(user.roleNames);
		const roleIds: EntityId[] = roleDtos.map((role: RoleDto) => role.id as EntityId);
		return this.userService.save(UserUcMapper.mapFromProvisioningUserOutputDtoToUserDto(user, roleIds));
	}
}
