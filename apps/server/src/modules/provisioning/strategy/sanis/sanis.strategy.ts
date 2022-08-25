import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { HttpService } from '@nestjs/axios';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserUc } from '@src/modules/user/uc';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { EntityId, Role, RoleName, School } from '@shared/domain';
import { RoleRepo, SchoolRepo } from '@shared/repo/index';
import { AccountUc } from '@src/modules/account/uc/account.uc';
import { AccountSaveDto } from '@src/modules/account/services/dto/index';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import CryptoJS from 'crypto-js';

export type SanisStrategyData = {
	provisioningUrl: string;
	accessToken: string;
	systemId: string;
};

@Injectable()
export class SanisProvisioningStrategy extends ProvisioningStrategy<SanisStrategyData> {
	constructor(
		private readonly responseMapper: SanisResponseMapper,
		private readonly schoolUc: SchoolUc,
		private readonly userUc: UserUc,
		private readonly schoolRepo: SchoolRepo,
		private readonly userRepo: UserDORepo,
		private readonly roleRepo: RoleRepo,
		private readonly httpService: HttpService,
		private readonly accountUc: AccountUc
	) {
		super();
	}

	override async apply(params: SanisStrategyData): Promise<ProvisioningDto> {
		const axiosConfig: AxiosRequestConfig = {
			headers: { Authorization: `Bearer ${params.accessToken}` },
		};

		const data: SanisResponse = await firstValueFrom(
			this.httpService.get(`${params.provisioningUrl}`, axiosConfig)
		).then((r: AxiosResponse<SanisResponse>) => {
			return r.data;
		});

		const school: SchoolDto = await this.provisionSchool(data, params.systemId);

		if (!school.id) {
			throw new UnprocessableEntityException(`Provisioning of usestrasr: ${data.pid} failed. No school id supplied.`);
		}

		const user: UserDO = await this.provisionUser(data, params.systemId, school.id);

		return new ProvisioningDto({ externalUserId: user.externalId as string });
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}

	protected async provisionSchool(data: SanisResponse, systemId: EntityId): Promise<SchoolDto> {
		const school: ProvisioningSchoolOutputDto = this.responseMapper.mapToSchoolDto(data, systemId);
		try {
			const schoolEntity: School = await this.schoolRepo.findByExternalIdOrFail(school.externalId, systemId);
			school.id = schoolEntity.id;
		} catch (e) {
			// ignore NotFoundException and create new school
		}

		const savedSchool: SchoolDto = await this.schoolUc.saveProvisioningSchoolOutputDto(school);
		return savedSchool;
	}

	protected async provisionUser(data: SanisResponse, systemId: EntityId, schoolId: EntityId): Promise<UserDO> {
		const roleName: RoleName = this.responseMapper.mapSanisRoleToRoleName(data);
		const role: Role = await this.roleRepo.findByName(roleName);
		const user: UserDO = this.responseMapper.mapToUserDO(data, schoolId, role.id);

		if (!user.externalId) {
			throw new UnprocessableEntityException('Cannot provision sanis user without external id');
		}

		let createNewAccount = false;
		try {
			const userEntity: UserDO = await this.userRepo.findByExternalIdOrFail(user.externalId, systemId);
			user.id = userEntity.id;
		} catch (e) {
			// ignore NotFoundException and create new user
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
