import { IncidentDto } from './incident.dto';

export class IncidentsResponse {
	constructor(data: IncidentDto[]) {
		this.data = data;
	}

	data: IncidentDto[];
}
