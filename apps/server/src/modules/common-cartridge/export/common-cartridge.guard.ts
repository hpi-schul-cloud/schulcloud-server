import { IntendedUseNotSupportedLoggableException } from './errors';
import { CommonCartridgeResource } from './interfaces';

export class CommonCartridgeGuard {
	public static checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void {
		if (!supportedIntendedUses.includes(intendedUse)) {
			throw new IntendedUseNotSupportedLoggableException(intendedUse);
		}
	}

	public static isResource(element: unknown): element is CommonCartridgeResource {
		const result = element instanceof CommonCartridgeResource;

		return result;
	}
}
