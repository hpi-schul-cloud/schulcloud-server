export interface SchulconnexPersonenInfoParams {
	organisationId: string;
	// TODO: handle vollstaending better in constructor to have something like ?vollstaendig=personen,gruppen...&organisation.id=123
	vollstaendig: string;
}
