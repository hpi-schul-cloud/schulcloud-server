export interface ICalendarEvent {
	data: {
		attributes: {
			summary: string;
			'x-sc-teamid': string;
		};
	}[];
}
