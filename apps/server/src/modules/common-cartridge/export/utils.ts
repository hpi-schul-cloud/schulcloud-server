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

type SerializedObjectId = {
	buffer: {
		type: 'Buffer';
		data: number[];
	};
};

export function createIdentifier(identifier?: string | ObjectId | SerializedObjectId): string {
	if (!identifier) {
		return `i${new ObjectId().toString()}`;
	}

	if (typeof identifier === 'string' || identifier instanceof ObjectId) {
		return `i${identifier.toString()}`;
	}

	// edgecase for stringified ObjectId returned from controller
	if (typeof identifier === 'object' && 'buffer' in identifier && identifier.buffer.type === 'Buffer') {
		return `i${new ObjectId(new Uint8Array(identifier.buffer.data)).toString()}`;
	}

	throw new Error(`Can't create identifier for ${util.inspect(identifier)}`);
}
