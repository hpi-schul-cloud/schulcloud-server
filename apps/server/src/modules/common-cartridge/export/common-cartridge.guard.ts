import { IntendedUseNotSupportedLoggableException } from './errors';

export class CommonCartridgeGuard {
	static checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void | never {
		if (!supportedIntendedUses.includes(intendedUse)) {
			throw new IntendedUseNotSupportedLoggableException(intendedUse);
		}
	}
}
