import { UUID } from 'bson';

export enum SanisRole {
	LEHR = 'Lehr',
	LERN = 'Lern',
	SYSA = 'Sysa',
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
		this.ktid = sanisResponsePersonenkontext.ktid;
		this.rolle = sanisResponsePersonenkontext.rolle;
		this.organisation = sanisResponsePersonenkontext.organisation;
		this.personenstatus = sanisResponsePersonenkontext.personenstatus;
	}

	ktid: UUID;

	rolle: SanisRole;

	organisation: SanisResponseOrganisation;

	personenstatus: string;
}

export class SanisResponseOrganisation {
	constructor(sanisResponseOrganisation: SanisResponseOrganisation) {
		this.orgid = sanisResponseOrganisation.orgid;
		this.name = sanisResponseOrganisation.name;
		this.typ = sanisResponseOrganisation.typ;
	}

	orgid: UUID;

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
