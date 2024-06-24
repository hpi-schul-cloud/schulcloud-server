import { IntendedUseNotSupportedLoggableException } from './errors';

export class CommonCartridgeGuard {
	public static checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void {
		if (!supportedIntendedUses.includes(intendedUse)) {
			throw new IntendedUseNotSupportedLoggableException(intendedUse);
		}
	}
}
