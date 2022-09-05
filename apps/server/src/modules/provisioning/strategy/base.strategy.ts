import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { UserService } from '@src/modules/user/service/user.service';

export abstract class ProvisioningStrategy<T> {
	constructor(
		private readonly responseMapper: IProviderResponseMapper<T>,
		private readonly schoolUc: SchoolUc,
		private readonly userService: UserService
	) {}

	abstract getProvisioningData(): Promise<T>;

	abstract getType(): SystemProvisioningStrategy;

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

		await this.userService.saveProvisioningUserOutputDto(userDto);

		const provisioningDto: ProvisioningDto = new ProvisioningDto({ schoolDto, userDto });
		return provisioningDto;
	}
}
