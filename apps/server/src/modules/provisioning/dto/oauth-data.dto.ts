import { ExternalGroupDto } from './external-group.dto';
import { ExternalSchoolDto } from './external-school.dto';
import { ExternalUserDto } from './external-user.dto';
import { ProvisioningSystemDto } from './provisioning-system.dto';

export class OauthDataDto {
	system: ProvisioningSystemDto;

	externalUser: ExternalUserDto;

	externalSchool?: ExternalSchoolDto;

	externalGroups?: ExternalGroupDto[];

	constructor(props: OauthDataDto) {
		this.system = props.system;
		this.externalUser = props.externalUser;
		this.externalSchool = props.externalSchool;
		this.externalGroups = props.externalGroups;
	}
}
