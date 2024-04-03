export class CalendarEventDto {
	title: string;

	teamId: string;

	id: string;

	constructor(dto: CalendarEventDto) {
		this.title = dto.title;
		this.teamId = dto.teamId;
		this.id = dto.id;
	}
}
