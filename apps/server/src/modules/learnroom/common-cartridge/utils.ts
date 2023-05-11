import { Builder as XmlBuilder } from 'xml2js';

type JSType = 'boolean' | 'number' | 'string' | 'object';

export function hasShape<T>(object: unknown, props: [keyof T, JSType][]): object is T {
	if (
		object &&
		typeof object === 'object' &&
		props.every(([propName, propType]) => typeof object[propName.toString()] === propType)
	) {
		return true;
	}
	return false;
}

// This is for caching the xml builder and having a global instance
const xmlBuilder = new XmlBuilder();

export function toXmlString(obj: unknown): string {
	return xmlBuilder.buildObject(obj);
}
