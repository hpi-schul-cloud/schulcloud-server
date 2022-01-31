import { BusinessError } from './business.error';

export class UserAlreadyAssignedToImportUserError extends BusinessError {
	constructor() {
		super({
			type: 'USER_ALREADY_ASSIGNED_TO_IMPORT_USER_ERROR',
			title: 'USER_ALREADY_ASSIGNED_TO_IMPORT_USER_ERROR',
			defaultMessage:
				'The selected user already has been referenced to a different import user. Only one reference is allowed.',
		});
	}
}
