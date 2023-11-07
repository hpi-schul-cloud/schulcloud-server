import { County } from '../type';

export class FederalStateDto {
	constructor(props: FederalStateDto) {
		this.id = props.id;
		this.name = props.name;
		this.abbreviation = props.abbreviation;
		this.logoUrl = props.logoUrl;
		this.counties = props.counties;
	}

	id: string;

	name: string;

	abbreviation: string;

	logoUrl: string;

	counties?: County[];
}
