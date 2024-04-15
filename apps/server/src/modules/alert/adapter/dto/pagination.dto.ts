import { LinksDto } from './links.dto';

export class PaginationDto {
	constructor(
		total: number,
		count: number,
		per_page: number,
		current_page: number,
		total_pages: number,
		links: LinksDto
	) {
		this.total = total;
		this.count = count;
		this.per_page = per_page;
		this.current_page = current_page;
		this.total_pages = total_pages;
		this.links = links;
	}

	total: number;

	count: number;

	per_page: number;

	current_page: number;

	total_pages: number;

	links: LinksDto;
}
