export class AccountSave {
	public id: string | undefined;

	public userId: string | undefined;

	public systemId: string | undefined;

	public username: string | undefined;

	public password: string | undefined;

	public lasttriedFailedLogin: Date | undefined;

	public activated: boolean | undefined;

	public idmReferenceId: string | undefined;

	public expiresAt: Date | undefined;

	public token: string | undefined;

	public credentialHash: string | undefined;

	constructor(props: Partial<Readonly<AccountSave>>) {
		this.id = props.id;
		this.userId = props.userId;
		this.systemId = props.systemId;
		this.username = props.username;
		this.password = props.password;
		this.lasttriedFailedLogin = props.lasttriedFailedLogin;
		this.activated = props.activated;
		this.idmReferenceId = props.idmReferenceId;
		this.expiresAt = props.expiresAt;
		this.token = props.token;
		this.credentialHash = props.credentialHash;
	}
}
