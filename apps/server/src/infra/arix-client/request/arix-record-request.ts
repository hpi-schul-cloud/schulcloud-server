export interface ArixRecordRequest {
	record: {
		user: string;
		identifier: string;
		template?: string;
	};
}
