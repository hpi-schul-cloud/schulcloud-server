import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from './common-cartridge.enums';

export type OmitVersion<T> = Omit<T, 'version'>;

export type OmitVersionAndFolder<T> = Omit<T, 'version' | 'folder'>;

const xmlBuilder = new Builder({ headless: true });

export function buildXmlString(obj: unknown): string {
	return xmlBuilder.buildObject(obj);
}

export function createVersionNotSupportedError(version: CommonCartridgeVersion): Error {
	return new Error(`Version ${version} is not supported`);
}

export function checkCommonCartridgeVersion(version: CommonCartridgeVersion): void | never {
	const supportedVersions = [
		CommonCartridgeVersion.V_1_1_0,
		CommonCartridgeVersion.V_1_2_0,
		CommonCartridgeVersion.V_1_3_0,
	];

	if (supportedVersions.includes(version)) {
		return;
	}

	throw createVersionNotSupportedError(version);
}

export function checkDefined<T>(value: T | undefined | null, name: string): T | never {
	if (value) {
		return value;
	}

	throw new Error(`${name} is null or undefined`);
}
