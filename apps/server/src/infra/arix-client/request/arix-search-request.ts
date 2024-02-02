import { ArixSearchCondition } from './arix-search-condition';

export interface ArixSearchRequest {
	search: {
		user: string; // uuid
		fields: string;
		condition: ArixSearchCondition | undefined;
		// limit=‘100‘ bedeutet, dass die ersten 100 Datensätze übermittelt werden. limit=‘100,200‘ bedeutet, dass die nächsten 100 Datensätze übermittelt werden.
		limit?: string;
	};
}
