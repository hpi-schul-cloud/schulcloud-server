export interface CalendarEvent {
	data: {
		attributes: {
			id: string;
			summary: string;
			'x-sc-teamid': string;
		};
	}[];
}
