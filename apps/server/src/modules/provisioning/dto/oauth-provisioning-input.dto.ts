import { ProvisioningSystemInputDto } from './provisioning-system-input.dto';

export class OauthProvisioningInputDto {
	accessToken: string;

	idToken: string;

	system: ProvisioningSystemInputDto;

	constructor(props: OauthProvisioningInputDto) {
		this.accessToken = props.accessToken;
		this.idToken = props.idToken;
		this.system = props.system;
	}
}
