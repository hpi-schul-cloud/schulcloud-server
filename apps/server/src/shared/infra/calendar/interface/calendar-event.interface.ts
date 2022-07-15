export interface ICalendarEvent {
	data: {
		attributes: {
			summary: string;
			'x-sc-teamId': string;
		};
	}[];
}
