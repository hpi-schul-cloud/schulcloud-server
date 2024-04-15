export class LinksDto {
	constructor(next_page: number, previous_page: number) {
		this.next_page = next_page;
		this.previous_page = previous_page;
	}

	next_page: number;

	previous_page: number;
}
