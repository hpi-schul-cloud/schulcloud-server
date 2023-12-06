import { InternalServerErrorException } from '@nestjs/common';
import { CommonCartridgeVersion } from '../common-cartridge.enums';

/**
 * Every element which should be listed in the Common Cartridge manifest must implement this interface.
 */
export abstract class CommonCartridgeElement {
	protected constructor(args: { version: CommonCartridgeVersion }) {
		this.checkVersion(args.version);
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

	private checkVersion(target: CommonCartridgeVersion): void | never {
		if (this.getSupportedVersion() === target) {
			return;
		}

		throw new InternalServerErrorException(`Common Cartridge version ${target} is not supported`);
	}
}
