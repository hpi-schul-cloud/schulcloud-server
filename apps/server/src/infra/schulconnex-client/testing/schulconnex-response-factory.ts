import { UUID } from 'bson';
import { Factory } from 'fishery';
import { SchulconnexGroupRole, SchulconnexGroupType, SchulconnexResponse, SchulconnexRole } from '../response';

export const schulconnexResponseFactory = Factory.define<SchulconnexResponse>(() => {
	return {
		pid: 'aef1f4fd-c323-466e-962b-a84354c0e713',
		person: {
			name: {
				vorname: 'Hans',
				familienname: 'Peter',
			},
			geburt: {
				datum: '2023-11-17',
			},
		},
		personenkontexte: [
			{
				id: new UUID().toString(),
				rolle: SchulconnexRole.LEIT,
				organisation: {
					id: new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e').toString(),
					name: 'schoolName',
					kennung: 'Kennung',
					anschrift: {
						ort: 'Hannover',
					},
				},
				erreichbarkeiten: [
					{
						typ: 'E-Mail',
						kennung: 'hans.peter@muster-schule.de',
					},
				],
				gruppen: [
					{
						gruppe: {
							id: new UUID().toString(),
							bezeichnung: 'bezeichnung',
							typ: SchulconnexGroupType.CLASS,
						},
						gruppenzugehoerigkeit: {
							rollen: [SchulconnexGroupRole.TEACHER],
						},
						sonstige_gruppenzugehoerige: [
							{
								rollen: [SchulconnexGroupRole.STUDENT],
								ktid: 'ktid',
							},
						],
					},
				],
			},
		],
	};
});
