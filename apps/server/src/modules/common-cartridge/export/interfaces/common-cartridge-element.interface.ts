import { CommonCartridgeVersion } from '../common-cartridge.enums';
import { VersionNotSupportedLoggableException } from '../errors';

type CommonCartridgeElementProps = {
	version: CommonCartridgeVersion;
	identifier?: string;
	title?: string;
};

/**
 * Every element which should be listed in the Common Cartridge manifest must implement this interface.
 */
export abstract class CommonCartridgeElement {
	protected constructor(private readonly baseProps: CommonCartridgeElementProps) {
		this.checkVersion(baseProps.version);
	}

	public get identifier(): string | undefined {
		return this.baseProps.identifier;
	}

	public get title(): string | undefined {
		return this.baseProps.title;
	}

	/**
	 * Every element must know which versions it supports.
	 * @returns The supported versions for this element.
	 */
	abstract getSupportedVersion(): CommonCartridgeVersion;

	/**
	 * This method is used to build the imsmanifest.xml file.
	 * @returns The XML object representation for the imsmanifest.xml file.
	 */
	abstract getManifestXmlObject(): Record<string, unknown>;

	private checkVersion(target: CommonCartridgeVersion): void {
		if (this.getSupportedVersion() !== target) {
			throw new VersionNotSupportedLoggableException(target);
		}
	}
}
