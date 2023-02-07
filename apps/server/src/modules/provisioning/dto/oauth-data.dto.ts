import { ExternalUserDto } from './external-user.dto';
import { ExternalSchoolDto } from './external-school.dto';
import { ProvisioningSystemDto } from './provisioning-system.dto';

export class OauthDataDto {
	system: ProvisioningSystemDto;

	externalUser: ExternalUserDto;

	externalSchool?: ExternalSchoolDto;

	constructor(props: OauthDataDto) {
		this.system = props.system;
		this.externalUser = props.externalUser;
		this.externalSchool = props.externalSchool;
	}
}
