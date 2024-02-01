import { ArixA } from '../type/arix-a';

export interface ArixLinkResponse {
	link: {
		a: ArixA[];
		size: string;
	};
}
