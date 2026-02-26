import { ObjectId } from '@mikro-orm/mongodb';
import { Builder } from 'xml2js';
import util from 'util';

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

export function createIdentifier(identifier?: string | ObjectId | unknown): string {
	if (!identifier) {
		return `i${new ObjectId().toString()}`;
	}

	if (typeof identifier === 'string' || identifier instanceof ObjectId) {
		return `i${identifier.toString()}`;
	}

	// edgecase for stringified ObjectId returned from controller
	if (
		typeof identifier === 'object' &&
		'buffer' in identifier &&
		typeof identifier.buffer === 'object' &&
		identifier.buffer !== null &&
		'type' in identifier.buffer &&
		typeof identifier.buffer.type === 'string' &&
		identifier.buffer.type === 'Buffer' &&
		'data' in identifier.buffer &&
		Array.isArray(identifier.buffer.data)
	) {
		return `i${new ObjectId(new Uint8Array(identifier.buffer.data)).toString()}`;
	}

	throw new Error(`Can't create identifier for ${util.inspect(identifier)}`);
}
