import { InternalServerErrorException } from '@nestjs/common';
import { ObjectID } from 'bson';
import { Builder } from 'xml2js';

export type OmitVersion<T> = Omit<T, 'version'>;

export type OmitVersionAndFolder<T> = Omit<T, 'version' | 'folder'>;

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

export function createIdentifier(identifier: string | ObjectID | undefined): string {
	if (!identifier) {
		return `i${new ObjectID().toString()}`;
	}

	return `i${identifier.toString()}`;
}

export function checkDefined<T>(value: T | undefined | null, name: string): T | never {
	if (value) {
		return value;
	}

	throw new Error(`${name} is null or undefined`);
}
