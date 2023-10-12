export class AuthenticationValues {
	keyValue: string;

	secretValue: string;

	constructor(props: AuthenticationValues) {
		this.keyValue = props.keyValue;
		this.secretValue = props.secretValue;
	}
}
