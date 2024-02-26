import { InternalServerErrorException } from '@nestjs/common';
import { ObjectID } from 'bson';
import { Builder } from 'xml2js';

export type OmitVersion<T> = Omit<T, 'version'>;

export type OmitVersionAndFolder<T> = Omit<T, 'version' | 'folder'>;

export type OmitVersionAndType<T> = Omit<T, 'version' | 'type'>;

const xmlBuilder = new Builder({
	xmldec: { version: '1.0', encoding: 'UTF-8' },
	renderOpts: { pretty: true, indent: '    ', newline: '\n' },
});

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

export function createIdentifier(identifier?: string | ObjectID): string {
	if (!identifier) {
		return `i${new ObjectID().toString()}`;
	}

	return `i${identifier.toString()}`;
}

export function checkIntendedUse(intendedUse: string, supportedIntendedUses: string[]): void | never {
	if (!supportedIntendedUses.includes(intendedUse)) {
		throw new Error(`Intended use ${intendedUse} is not supported`);
	}
}
