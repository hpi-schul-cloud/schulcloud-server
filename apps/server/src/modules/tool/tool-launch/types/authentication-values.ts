export class AuthenticationValues {
	public keyValue: string;

	public secretValue: string;

	constructor(props: AuthenticationValues) {
		this.keyValue = props.keyValue;
		this.secretValue = props.secretValue;
	}
}
