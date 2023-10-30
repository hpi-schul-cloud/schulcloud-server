import xml2json from '@hendt/xml2json';
import { Injectable } from '@nestjs/common';

/**
 * This class encapsulates
 */
@Injectable()
export class ConverterUtil {
	xml2object<T>(xml: string): T {
		return xml2json(xml) as T;
	}
}
