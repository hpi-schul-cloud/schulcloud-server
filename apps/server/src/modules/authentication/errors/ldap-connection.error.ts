import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class LdapConnectionError extends BusinessError {
	constructor(details?: Record<string, unknown>) {
		super(
			{
				type: 'LDAP_CONNECTION_FAILED',
				title: 'LDAP connection failed',
				defaultMessage: 'LDAP connection failed',
			},
			HttpStatus.BAD_GATEWAY,
			details
		);
	}
}
