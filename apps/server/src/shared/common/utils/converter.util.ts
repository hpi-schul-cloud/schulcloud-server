import { Injectable } from '@nestjs/common';
import xml2json from '@hendt/xml2json';

/**
 * This class encapsulates
 */
@Injectable()
export class ConverterUtil {
	xml2object<T>(xml: string): T {
		return xml2json(xml) as T;
	}
}
