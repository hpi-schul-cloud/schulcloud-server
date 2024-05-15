import { CommonCartridgeVersion } from '../common-cartridge.enums';

type CommonCartridgeBaseProps = {
	version: CommonCartridgeVersion;
	identifier?: string;
	title?: string;
};

export abstract class CommonCartridgeBase {
	protected constructor(public readonly baseProps: CommonCartridgeBaseProps) {
		this.checkVersion(baseProps.version);
	}

	public get identifier(): string | undefined {
		return this.baseProps.identifier;
	}

	public get title(): string | undefined {
		return this.baseProps.title;
	}

	abstract getSupportedVersion(): CommonCartridgeVersion;

	private checkVersion(target: CommonCartridgeVersion): void {
		if (this.getSupportedVersion() !== target) {
			throw new Error(`Version ${target} is not supported.`);
		}
	}
}
