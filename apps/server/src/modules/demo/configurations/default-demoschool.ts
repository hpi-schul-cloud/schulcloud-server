import { ComponentType, RoleName } from '@shared/domain';
import { FederalStateNames } from '@src/modules/legacy-school/types';
import { DemoConfiguration } from '../types';

const configuration: DemoConfiguration = {
	schools: [
		{
			name: 'DEMO_Meine kleine Demoschule',
			federalStateName: FederalStateNames.NIEDERSACHSEN,
			users: [
				{
					roleNames: [RoleName.ADMINISTRATOR],
					firstName: 'Adam',
					lastName: 'Riese',
					email: 'adam.riese@schul-cloud.org',
				},
				{
					roleNames: [RoleName.TEACHER],
					firstName: 'Teddy',
					lastName: 'Cherwood',
					email: 'teddy.cherwood@schul-cloud.org',
				},
				{
					roleNames: [RoleName.TEACHER],
					firstName: 'Susan',
					lastName: 'Teak',
					email: 'susan.teak@schul-cloud.org',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Alex',
					lastName: 'Erster',
					email: 'alex.erster@schul-cloud.org',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Bart',
					lastName: 'Sekundus',
					email: 'bart.sekundus@schul-cloud.org',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Celin',
					lastName: 'Tres',
					email: 'celin.tres@schul-cloud.org',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Dave',
					lastName: 'Quadro',
					email: 'dave.quadro@schul-cloud.org',
				},
			],
			courses: [
				{
					name: 'DemoCourse',
					teachers: ['teddy.cherwood@schul-cloud.org'],
					substitutionTeachers: ['susan.teak@schul-cloud.org'],
					students: [
						'alex.erster@schul-cloud.org',
						'bart.sekundus@schul-cloud.org',
						'celin.tres@schul-cloud.org',
						'dave.quadro@schul-cloud.org',
					],
					lessons: [
						{
							name: 'My first lesson',
							contents: [
								{
									component: ComponentType.TEXT,
									title: 'Ein Text',
									hidden: false,
									content: { text: '<p><strong>Super</strong> das klappt</p>' },
								},
								{
									component: ComponentType.TEXT,
									title: 'Noch ein Text',
									hidden: false,
									content: { text: '<p>Auch hier: wenig Inhalt.</p>' },
								},
							],
						},
						{
							name: 'My second lesson',
							contents: [
								{
									component: ComponentType.TEXT,
									title: 'Überschriften haben wir auch',
									hidden: false,
									content: { text: '<p>Aber der Text ist auch hier nicht doll.</p>' },
								},
							],
						},
					],
				},
			],
		},
	],
};

export default configuration;
