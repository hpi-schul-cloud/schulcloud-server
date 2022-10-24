import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { EntityId, Role, RoleName } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import CryptoJS from 'crypto-js';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { RoleRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { AccountUc } from '@src/modules/account/uc/account.uc';

@Injectable()
export class SanisUserService {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly roleRepo: RoleRepo,
		private readonly userRepo: UserDORepo,
		private readonly accountUc: AccountUc
	) {}

	async provisionUser(data: SanisResponse, systemId: EntityId, schoolId: EntityId): Promise<UserDO> {
		const roleName: RoleName = this.responseMapper.mapSanisRoleToRoleName(data);
		const role: Role = await this.roleRepo.findByName(roleName);
		const user: UserDO = this.responseMapper.mapToUserDO(data, schoolId, role.id);

		if (!user.externalId) {
			throw new UnprocessableEntityException('Cannot provision sanis user without external id');
		}

		let createNewAccount = false;
		const userEntity: UserDO | null = await this.userRepo.findByExternalId(user.externalId, systemId);
		if (userEntity) {
			user.id = userEntity.id;
		} else {
			createNewAccount = true;
		}
		const savedUser: UserDO = await this.userRepo.save(user);

		if (createNewAccount) {
			await this.accountUc.saveAccount(
				new AccountSaveDto({
					userId: savedUser.id,
					username: CryptoJS.SHA256(savedUser.id as string).toString(CryptoJS.enc.Base64),
					systemId,
					activated: true,
				})
			);
		}

		return savedUser;
	}
}
