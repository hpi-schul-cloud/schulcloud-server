import { ObjectId } from 'bson';
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

export function createIdentifier(identifier?: string | ObjectId): string {
	if (!identifier) {
		return `i${new ObjectId().toString()}`;
	}

	return `i${identifier.toString()}`;
}
