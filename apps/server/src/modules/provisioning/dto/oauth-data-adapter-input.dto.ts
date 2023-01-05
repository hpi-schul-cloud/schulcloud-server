import { ProvisioningSystemDto } from './provisioning-system.dto';

export class OauthDataAdapterInputDto {
	accessToken: string;

	idToken: string;

	system: ProvisioningSystemDto;

	constructor(props: OauthDataAdapterInputDto) {
		this.accessToken = props.accessToken;
		this.idToken = props.idToken;
		this.system = props.system;
	}
}
