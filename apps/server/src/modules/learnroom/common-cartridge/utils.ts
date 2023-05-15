import { Builder as XmlBuilder } from 'xml2js';

// This is for caching the xml builder and having a global instance
const xmlBuilder = new XmlBuilder();

export function toXmlString(obj: unknown): string {
	return xmlBuilder.buildObject(obj);
}
