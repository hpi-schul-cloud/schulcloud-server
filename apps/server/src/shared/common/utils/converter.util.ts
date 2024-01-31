import { Injectable } from '@nestjs/common';
import { X2jOptions, XMLParser } from 'fast-xml-parser';

/**
 * This class encapsulates
 */
@Injectable()
export class ConverterUtil {
	xml2object<T>(xml: string, options?: X2jOptions): T {
		const parser: XMLParser = new XMLParser(
			options || {
				ignoreAttributes: false,
				attributeNamePrefix: '',
				textNodeName: 'value',
			}
		);

		return parser.parse(xml) as T;
	}
}
