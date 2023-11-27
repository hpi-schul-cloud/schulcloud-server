export class LdapConfig {
	active: boolean;

	url: string;

	provider?: string;

	constructor(props: LdapConfig) {
		this.active = props.active;
		this.url = props.url;
		this.provider = props.provider;
	}
}
