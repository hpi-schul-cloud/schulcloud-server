import { UUID } from 'bson';

export enum SanisRole {
	LEHR = 'Lehr',
	LERN = 'Lern',
	LEIT = 'Leit',
	ORGADMIN = 'OrgAdmin',
}

export class SanisResponseName {
	constructor(sanisResponseName: SanisResponseName) {
		this.familienname = sanisResponseName.familienname;
		this.vorname = sanisResponseName.vorname;
	}

	familienname: string;

	vorname: string;
}

export class SanisResponsePersonenkontext {
	constructor(sanisResponsePersonenkontext: SanisResponsePersonenkontext) {
		this.id = sanisResponsePersonenkontext.id;
		this.rolle = sanisResponsePersonenkontext.rolle;
		this.organisation = sanisResponsePersonenkontext.organisation;
		this.personenstatus = sanisResponsePersonenkontext.personenstatus;
		this.email = sanisResponsePersonenkontext.email;
	}

	id: UUID;

	rolle: SanisRole;

	organisation: SanisResponseOrganisation;

	personenstatus: string;

	// TODO change if neccessary once we have the proper specification
	email: string;
}

export class SanisResponseOrganisation {
	constructor(sanisResponseOrganisation: SanisResponseOrganisation) {
		this.id = sanisResponseOrganisation.id;
		this.kennung = sanisResponseOrganisation.kennung;
		this.name = sanisResponseOrganisation.name;
		this.typ = sanisResponseOrganisation.typ;
	}

	id: UUID;

	kennung: string;

	name: string;

	typ: string;
}

export class SanisResponse {
	constructor(sanisResponse: SanisResponse) {
		this.pid = sanisResponse.pid;
		this.person = sanisResponse.person;
		this.personenkontexte = sanisResponse.personenkontexte;
	}

	pid: string;

	person: {
		name: SanisResponseName;
		geschlecht: string;
		lokalisierung: string;
		vertrauensstufe: string;
	};

	personenkontexte: SanisResponsePersonenkontext[];
}
