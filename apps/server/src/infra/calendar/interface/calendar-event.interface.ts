export interface CalendarEvent {
	data: {
		attributes: {
			summary: string;
			'x-sc-teamid': string;
		};
	}[];
}
