import { ComponentType, RoleName } from '@shared/domain';
import { FederalStateNames as FederalStateName } from '@src/modules/school/types';
import { DemoConfiguration } from '../types';

const configuration: DemoConfiguration = {
	schools: [
		{
			name: 'Meine kleine Demoschule',
			federalStateName: FederalStateName.NIEDERSACHSEN,
			users: [
				{
					roleNames: [RoleName.ADMINISTRATOR],
					firstName: 'Adam',
					lastName: 'Riese',
					email: 'adam.riese@example.com',
				},
				{
					roleNames: [RoleName.TEACHER],
					firstName: 'Teddy',
					lastName: 'Cherwood',
					email: 'teddy.cherwood@example.com',
				},
				{
					roleNames: [RoleName.TEACHER],
					firstName: 'Susan',
					lastName: 'Teak',
					email: 'susan.teak@example.com',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Alex',
					lastName: 'Erster',
					email: 'alex.erster@example.com',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Bart',
					lastName: 'Sekundus',
					email: 'bart.sekundus@example.com',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Celin',
					lastName: 'Tres',
					email: 'celin.tres@example.com',
				},
				{
					roleNames: [RoleName.STUDENT],
					firstName: 'Dave',
					lastName: 'Quadro',
					email: 'dave.quadro@example.com',
				},
			],
			courses: [
				{
					name: 'DemoCourse',
					teachers: ['teddy.cherwood@example.com'],
					substitutionTeachers: ['susan.teak@example.com'],
					students: [
						'alex.erster@example.com',
						'bart.sekundus@example.com',
						'celin.tres@example.com',
						'dave.quadro@example.com',
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
