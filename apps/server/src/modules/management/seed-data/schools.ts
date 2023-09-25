/* eslint-disable @typescript-eslint/dot-notation */
import {
	FederalStateEntity,
	ISchoolProperties,
	SchoolFeatures,
	SchoolRoles,
	SchoolYearEntity,
	SystemEntity,
} from '@shared/domain';
import { federalStateFactory, schoolFactory } from '@shared/testing';
import { SchoolPurpose } from '@src/modules/school/domain';
import { DeepPartial } from 'fishery';
import { EFederalState } from './federalstates';
import { SeedSchoolYearEnum } from './schoolyears';

type SeedSchoolProperties = Omit<ISchoolProperties, 'systems' | 'federalState'> & {
	id: string;
	updatedAt?: string;
	createdAt?: string;
	county?: {
		id: string;
		countyId: number;
		name: string;
		antaresKey: string;
	};
	systems?: string[];
	currentYear?: SeedSchoolYearEnum;
	permissions?: SchoolRoles;
	federalState?: EFederalState;
	fileStorageType?: string;
	purpose?: string;
	documentBaseDirType?: string;
	experimental?: boolean;
	pilot?: boolean;
	timezone?: string;
	language?: string;
	logo_dataUrl?: string;
	enableStudentTeamCreation?: boolean;
};

const seedSchools: SeedSchoolProperties[] = [
	{
		id: '5f2987e020834114b8efd6f6',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Demo Schule',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8813',
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2017-08-24T12:04:11.721Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5f2987e020834114b8efd6f7',
		updatedAt: '2020-08-04T07:21:33.616Z',
		name: 'Schiller-Oberschule',
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5f2987e020834114b8efd6f8',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Paul-Gerhardt-Gymnasium',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8812',
			countyId: 12051,
			name: 'Brandenburg an der Havel',
			antaresKey: 'BRB',
		},
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [
			SchoolFeatures.ROCKET_CHAT,
			SchoolFeatures.LDAP_UNIVENTION_MIGRATION,
			SchoolFeatures.VIDEOCONFERENCE,
			SchoolFeatures.OAUTH_PROVISIONING_ENABLED,
		],
		enableStudentTeamCreation: false,
	},
	{
		id: '5f2987e020834114b8efd6f9',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Expertenschule',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8813',
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2018-11-09T10:04:11.721Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.EXPERT,
		features: [SchoolFeatures.ROCKET_CHAT, SchoolFeatures.VIDEOCONFERENCE, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5fa2c5ccb229544f2c69666c',
		updatedAt: '2020-11-04T21:58:25.254Z',
		name: 'Felix Mendelssohn-Gymnasium',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8813',
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2020-11-04T15:16:28.827Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeatures.ROCKET_CHAT, SchoolFeatures.STUDENTVISIBILITY, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		language: 'de',
		logo_dataUrl: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fa318f2b229544f2c697a56',
		updatedAt: '2020-11-04T21:59:44.255Z',
		name: 'Ludwig van Beethoven-Liceum',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8813',
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2020-11-04T21:11:14.312Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeatures.ROCKET_CHAT, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		language: 'de',
		logo_dataUrl: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fa31f3db229544f2c697e3e',
		updatedAt: '2020-11-04T21:54:10.847Z',
		name: 'Brasilien Schule',
		federalState: EFederalState.INTERNATIONAL_SCHOOL,
		createdAt: '2020-11-04T21:38:05.110Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeatures.ROCKET_CHAT, SchoolFeatures.STUDENTVISIBILITY, SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		timezone: 'America/Belem',
		language: 'en',
		logo_dataUrl: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fcfb0bc685b9af4d4abf899',
		updatedAt: '2020-12-08T16:58:36.527Z',
		name: 'school in Ni',
		federalState: EFederalState.NIEDERSACHSEN,
		county: {
			id: '5fa55eb53f472a2d986c8812',
			countyId: 3256,
			name: 'Nienburg/Weser',
			antaresKey: 'NI',
		},
		createdAt: '2020-12-08T16:58:36.527Z',
		systems: [],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
	},
	{
		id: '5fda01df490123cba891a193',
		updatedAt: '2020-12-16T12:47:27.338Z',
		name: 'graveyard school (tombstone users only)',
		createdAt: '2020-12-16T12:47:27.338Z',
		systems: [],
		purpose: SchoolPurpose.TOMBSTONE,
		features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
	},
	{
		id: '5f2987e020834114b8efd600',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'OIDC-Mock-School',
		federalState: EFederalState.BRANDENBURG,
		county: {
			id: '5fa55eb53f472a2d986c8812',
			countyId: 12051,
			name: 'Brandenburg an der Havel',
			antaresKey: 'BRB',
		},
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: ['62c7f233f35a554ba3ed42f1'],
		fileStorageType: 'awsS3',
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [
			SchoolFeatures.OAUTH_PROVISIONING_ENABLED,
			SchoolFeatures.LDAP_UNIVENTION_MIGRATION,
			SchoolFeatures.VIDEOCONFERENCE,
			SchoolFeatures.OAUTH_PROVISIONING_ENABLED,
		],
		externalId: '0000d186816abba584714c92',
		enableStudentTeamCreation: false,
	},
];

export function generateSchools(entities: {
	systems: SystemEntity[];
	schoolYears: SchoolYearEntity[];
	federalStates: FederalStateEntity[];
}) {
	return seedSchools.map((partial) => {
		const schoolYear = entities.schoolYears.find((sy) => partial.currentYear && sy.name === partial.currentYear);
		const systems = partial.systems
			?.map((systemId) => entities.systems.find((s) => s.id === systemId))
			.filter((s) => s) as SystemEntity[] | undefined;

		const federalState =
			entities.federalStates.find((fs) => partial.federalState && fs.name === partial.federalState) ??
			federalStateFactory.build();

		const params: DeepPartial<ISchoolProperties> = {
			externalId: partial.externalId,
			features: partial.features,
			inMaintenanceSince: partial.inMaintenanceSince,
			name: partial.name,
			inUserMigration: partial.inUserMigration,
			officialSchoolNumber: partial.officialSchoolNumber,
			previousExternalId: partial.previousExternalId,
			userLoginMigration: partial.userLoginMigration,
			schoolYear,
			systems,
			federalState,
		};
		const schoolEntity = schoolFactory.buildWithId(params, partial.id);

		schoolEntity.permissions = partial.permissions;

		// entries not part of the school entity, they are not saved in the database
		schoolEntity['fileStorageType'] = partial.fileStorageType;
		schoolEntity['purpose'] = partial.purpose;
		schoolEntity['documentBaseDirType'] = partial.documentBaseDirType;
		schoolEntity['experimental'] = partial.experimental;
		schoolEntity['pilot'] = partial.pilot;
		schoolEntity['timezone'] = partial.timezone;
		schoolEntity['language'] = partial.language;
		schoolEntity['logo_dataUrl'] = partial.logo_dataUrl;
		schoolEntity['enableStudentTeamCreation'] = partial.enableStudentTeamCreation;

		return schoolEntity;
	});
}
