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
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { School, User } from '@shared/domain';

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
		private readonly httpService: HttpService
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

		const school: ProvisioningSchoolOutputDto = this.responseMapper.mapToSchoolDto(data, params.systemId);
		try {
			const schoolEntity: School = this.schoolUc.findByExternalId(school.externalId);
			school.id = schoolEntity.id;
		} catch (e) {
			// ignore NotFoundException and create new school
		}

		const savedSchool: SchoolDto = await this.schoolUc.saveProvisioningSchoolOutputDto(school);

		if (!savedSchool.id) {
			throw new UnprocessableEntityException(`Provisioning of usestrasr: ${data.pid} failed. No school id supplied.`);
		}

		const user: ProvisioningUserOutputDto = this.responseMapper.mapToUserDto(data, savedSchool.id);
		try {
			const userEntity: User = this.userUc.findByExternalId(user.externalId);
			user.id = userEntity.id;
		} catch (e) {
			// ignore NotFoundException and create new user
		}
		await this.userUc.saveProvisioningUserOutputDto(user);

		return new ProvisioningDto({ externalUserId: user.externalId });
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.SANIS;
	}
}
