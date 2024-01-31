import { ArixField } from './arix-field';

export interface ArixRecord {
	f: (ArixField | string)[];
	br?: {
		'br>': string[];
	};
}
