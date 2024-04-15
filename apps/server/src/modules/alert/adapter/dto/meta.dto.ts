import { PaginationDto } from './pagination.dto';

export class MetaDto {
	constructor(pagination: PaginationDto) {
		this.pagination = pagination;
	}

	pagination: PaginationDto;
}
