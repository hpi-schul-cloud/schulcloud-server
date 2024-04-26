import { IntendedUseNotSupportedLoggableException } from './errors';
import { CommonCartridgeElement, CommonCartridgeResource } from './interfaces';

export class CommonCartridgeGuard {
	public static checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void {
		if (!supportedIntendedUses.includes(intendedUse)) {
			throw new IntendedUseNotSupportedLoggableException(intendedUse);
		}
	}

	public static isResource(
		element: CommonCartridgeElement | (CommonCartridgeElement | CommonCartridgeResource)[]
	): element is CommonCartridgeResource {
		const result = element instanceof CommonCartridgeResource;

		return result;
	}
}
