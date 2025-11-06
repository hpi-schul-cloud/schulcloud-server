import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { VersionNotSupportedLoggableException } from '../errors';

type CommonCartridgeBaseProps = {
	version: CommonCartridgeVersion;
	identifier?: string;
	title?: string;
};

export abstract class CommonCartridgeBase {
	protected constructor(public readonly baseProps: CommonCartridgeBaseProps) {
		this.checkVersion(baseProps.version);
	}

	get identifier(): string | undefined {
		return this.baseProps.identifier;
	}

	get title(): string | undefined {
		return this.baseProps.title;
	}

	public abstract getSupportedVersion(): CommonCartridgeVersion;

	private checkVersion(target: CommonCartridgeVersion): void {
		if (this.getSupportedVersion() !== target) {
			throw new VersionNotSupportedLoggableException(target);
		}
	}
}
