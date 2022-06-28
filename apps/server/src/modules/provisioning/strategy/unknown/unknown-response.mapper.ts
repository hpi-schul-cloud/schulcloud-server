import { IProviderResponseMapper } from '@src/modules/provisioning/interface/provider-response.mapper.interface';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { UnknownResponse } from '@src/modules/provisioning/strategy/unknown/unknown.response';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleName } from '@shared/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UnknownResponseMapper implements IProviderResponseMapper<UnknownResponse> {
	mapToDto(source: UnknownResponse): ProvisioningDto {
		const schoolDto = new SchoolDto({
			name: source.schoolName,
		});
		const userDto = new UserDto({
			email: source.email,
			firstName: source.firstName,
			lastName: source.lastName,
			roles: source.userRoles.map((role) => {
				return new RoleDto({ name: role as RoleName });
			}), // TODO
			school: schoolDto,
		});
		return new ProvisioningDto({ userDto, schoolDto });
	}
}
