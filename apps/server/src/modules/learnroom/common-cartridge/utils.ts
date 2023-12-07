import { InternalServerErrorException } from '@nestjs/common';
import { Builder } from 'xml2js';
import { CommonCartridgeVersion } from './common-cartridge.enums';

export type OmitVersion<T> = Omit<T, 'version'>;

export type OmitVersionAndFolder<T> = Omit<T, 'version' | 'folder'>;

const xmlBuilder = new Builder({ xmldec: { version: '1.0', encoding: 'UTF-8' } });

export function buildXmlString(obj: unknown): string {
	return xmlBuilder.buildObject(obj);
}

export function createVersionNotSupportedError(version: string): Error {
	return new InternalServerErrorException(`Common Cartridge version ${version} is not supported`);
}

export function createResourceTypeNotSupportedError(type: string): Error {
	return new InternalServerErrorException(`Common Cartridge resource type ${type} is not supported`);
}

export function createElementTypeNotSupportedError(type: string): Error {
	// AI next 1 line
	return new InternalServerErrorException(`Common Cartridge element type ${type} is not supported`);
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
