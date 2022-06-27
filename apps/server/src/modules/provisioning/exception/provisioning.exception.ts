export class ProvisioningException extends Error {
	readonly message: string;

	readonly errorcode: string;

	readonly DEFAULT_MESSAGE: string = 'Error in Provisioning Process.';

	readonly DEFAULT_ERRORCODE: string = 'ProvisioningFailed';

	constructor(message?: string, errorcode?: string) {
		super(message);
		this.message = message || this.DEFAULT_MESSAGE;
		this.errorcode = errorcode || this.DEFAULT_ERRORCODE;
	}
}
