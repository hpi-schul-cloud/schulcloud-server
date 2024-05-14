import { IntendedUseNotSupportedLoggableException } from './errors';
import { CommonCartridgeOrganization, CommonCartridgeResource } from './interfaces';

export class CommonCartridgeGuard {
	public static checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void {
		if (!supportedIntendedUses.includes(intendedUse)) {
			throw new IntendedUseNotSupportedLoggableException(intendedUse);
		}
	}

	public static isResource(element: object): element is CommonCartridgeResource {
		throw new Error('Method not implemented.');
	}

	public static isOrganization(element: object): element is CommonCartridgeOrganization {
		throw new Error('Method not implemented.');
	}
}
