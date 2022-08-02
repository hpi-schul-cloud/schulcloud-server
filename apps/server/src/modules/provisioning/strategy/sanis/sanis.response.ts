import {UUID} from "bson";

export enum SanisRole{
	LEHR = "LEHR",
	LERN = "LERN",
}

export class SanisResponseName {
	constructor(sanisResponseName: SanisResponseName){
		this.familienname = sanisResponseName.familienname;
		this.vorname = sanisResponseName.vorname;
	}

	familienname: string;
	vorname: string;
}

export class SanisResponsePersonenkontext {
	constructor(sanisResponsePersonenkontext: SanisResponsePersonenkontext){
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
	constructor(sanisResponseOrganisation: SanisResponseOrganisation){
		this.orgid = sanisResponseOrganisation.orgid;
		this.name = sanisResponseOrganisation.name;
		this.typ = sanisResponseOrganisation.typ;
	}

	orgid: UUID;
	name: string;
	typ: string;
}

export class SanisResponse {
	constructor(placeholderResponse: SanisResponse) {
		this.pid = placeholderResponse.pid;
		this.person = placeholderResponse.person;
		this.personenkontexte = placeholderResponse.personenkontexte;
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
