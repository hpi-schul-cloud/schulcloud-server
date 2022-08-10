import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUc } from '@src/modules/user/uc';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { AxiosRequestConfig } from 'axios';

export abstract class ProvisioningStrategy<T> {
	protected config?: AxiosRequestConfig;

	protected provisioningUrl?: string;

	constructor(
		private readonly responseMapper: IProviderResponseMapper<T>,
		private readonly schoolUc: SchoolUc,
		private readonly userUc: UserUc
	) {
		this.config = {};
	}

	abstract getProvisioningData(): Promise<T>;

	abstract getType(): SystemProvisioningStrategy;

	init(provisioningUrl: string, config: AxiosRequestConfig) {
		this.provisioningUrl = provisioningUrl;
		this.config = config;
	}

	async apply(): Promise<ProvisioningDto> {
		const provisioningData: T = await this.getProvisioningData();

		const schoolDto: ProvisioningSchoolOutputDto | undefined = this.responseMapper.mapToSchoolDto(provisioningData);
		let userDto: ProvisioningUserOutputDto;

		if (schoolDto) {
			const savedSchoolDto: SchoolDto = await this.schoolUc.saveProvisioningSchoolOutputDto(schoolDto);
			userDto = this.responseMapper.mapToUserDto(provisioningData, savedSchoolDto.id);
		} else {
			throw new Error('No school found during provisioning process.');
		}
		await this.userUc.saveProvisioningUserOutputDto(userDto);
		const provisioningDto: ProvisioningDto = new ProvisioningDto({ schoolDto, userDto });
		return provisioningDto;
	}
}
