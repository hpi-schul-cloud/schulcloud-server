export class ProvisioningException extends Error {
	readonly message: string;

	readonly errorcode: string;

	constructor(message: string, errorcode: string) {
		super(message);
		this.message = message;
		this.errorcode = errorcode;
	}
}
