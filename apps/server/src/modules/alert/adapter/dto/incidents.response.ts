import { IncidentDto } from './incident.dto';
import { MetaDto } from './meta.dto';

export class IncidentsResponse {
	constructor(meta: MetaDto, data: IncidentDto[]) {
		this.meta = meta;
		this.data = data;
	}

	meta: MetaDto;

	data: IncidentDto[];
}
