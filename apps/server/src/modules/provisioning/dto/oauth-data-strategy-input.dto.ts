import { ProvisioningSystemDto } from './provisioning-system.dto';

export class OauthDataStrategyInputDto {
	accessToken: string;

	idToken: string;

	system: ProvisioningSystemDto;

	constructor(props: OauthDataStrategyInputDto) {
		this.accessToken = props.accessToken;
		this.idToken = props.idToken;
		this.system = props.system;
	}
}
