import { type ExternalClassDto } from './external-class.dto';
import { type ExternalGroupDto } from './external-group.dto';
import { type ExternalLicenseDto } from './external-license.dto';
import { type ExternalSchoolDto } from './external-school.dto';
import { type ExternalUserDto } from './external-user.dto';
import { type ProvisioningSystemDto } from './provisioning-system.dto';

export class OauthDataDto {
	system: ProvisioningSystemDto;

	externalUser: ExternalUserDto;

	externalSchool?: ExternalSchoolDto;

	externalGroups?: ExternalGroupDto[];

	externalLicenses?: ExternalLicenseDto[];

	externalClasses?: ExternalClassDto[];

	constructor(props: OauthDataDto) {
		this.system = props.system;
		this.externalUser = props.externalUser;
		this.externalSchool = props.externalSchool;
		this.externalGroups = props.externalGroups;
		this.externalLicenses = props.externalLicenses;
		this.externalClasses = props.externalClasses;
	}
}
