import { IProviderResponse } from '@src/modules/provisioning/interface/provider.response.interface';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { UserUc } from '@src/modules/user/uc';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';

export abstract class ProvisioningStrategy<T extends IProviderResponse> {
	constructor(
		private readonly responseMapper: IProviderResponseMapper<T>,
		private readonly schoolUc: SchoolUc,
		private readonly userUc: UserUc
	) {}

	abstract getProvisioningData(): Promise<T>;

	async apply(): Promise<ProvisioningDto> {
		const provisioningData: T = await this.getProvisioningData();

		const schoolDto: ProvisioningSchoolOutputDto | undefined = this.responseMapper.mapToSchoolDto(provisioningData);
		let userDto: ProvisioningUserOutputDto;

		if (schoolDto) {
			const savedSchoolDto: SchoolDto = await this.schoolUc.saveProvisioningSchoolOutputDto(schoolDto);
			userDto = this.responseMapper.mapToUserDto(provisioningData, savedSchoolDto.id);
		} else {
			userDto = this.responseMapper.mapToUserDto(provisioningData);
		}

		await this.userUc.saveProvisioningUserOutputDto(userDto);

		const provisioningDto: ProvisioningDto = new ProvisioningDto({ schoolDto, userDto });
		return provisioningDto;
	}
}
