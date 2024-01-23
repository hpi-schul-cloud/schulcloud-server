export type SchulconnexPropertyContext = 'personen' | 'personenkontexte' | 'organisationen' | 'gruppen' | 'beziehungen';

export interface SchulconnexPersonenInfoParams {
	vollstaendig?: SchulconnexPropertyContext[];

	pid?: string;

	'personenkontext.id'?: string;

	'organisation.id'?: string;

	'gruppe.id'?: string;
}
