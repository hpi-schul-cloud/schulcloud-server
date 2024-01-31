import { Injectable } from '@nestjs/common';
import { X2jOptions, XMLBuilder, XmlBuilderOptions, XMLParser } from 'fast-xml-parser';

/**
 * This class encapsulates
 */
@Injectable()
export class ConverterUtil {
	private readonly defaultOptions = {
		ignoreAttributes: false,
		attributeNamePrefix: '',
		textNodeName: 'value',
	};

	xml2object<T>(xml: string, options?: X2jOptions): T {
		const parser: XMLParser = new XMLParser({ ...this.defaultOptions, ...options });

		return parser.parse(xml) as T;
	}

	object2xml<T>(object: T, options?: XmlBuilderOptions): string {
		const builder: XMLBuilder = new XMLBuilder({ ...this.defaultOptions, ...options });

		return builder.build(object) as string;
	}
}
