export class CalendarEventDto {
	title: string;

	teamId: string;

	constructor(dto: CalendarEventDto) {
		this.title = dto.title;
		this.teamId = dto.teamId;
	}
}
