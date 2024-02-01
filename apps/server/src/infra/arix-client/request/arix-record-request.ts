export interface ArixRecordRequest {
	record: {
		user: string; // uuid
		identifier: string;
		template: 'plain' | string;
	};
}
