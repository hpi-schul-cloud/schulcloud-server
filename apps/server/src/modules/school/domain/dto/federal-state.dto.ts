import { County } from '../type';

export class FederalStateDto {
	constructor({ id, name, abbreviation, logoUrl, counties }: FederalStateDto) {
		this.id = id;
		this.name = name;
		this.abbreviation = abbreviation;
		this.logoUrl = logoUrl;
		this.counties = counties;
	}

	id: string;

	name: string;

	abbreviation: string;

	logoUrl: string;

	counties?: County[];
}
