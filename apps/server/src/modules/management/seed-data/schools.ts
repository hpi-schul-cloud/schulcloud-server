/* eslint-disable @typescript-eslint/dot-notation */
import {
	FederalStateEntity,
	SchoolProperties,
	SchoolRoles,
	SchoolYearEntity,
	SystemEntity,
} from '@shared/domain/entity';
import { LanguageType } from '@shared/domain/interface';
import { SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import { federalStateFactory, schoolEntityFactory } from '@shared/testing/factory';
import { FileStorageType } from '@src/modules/school/domain/type/file-storage-type.enum';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeepPartial } from 'fishery';
import { EFederalState } from './federalstates';
import { SeedSchoolYearEnum } from './schoolyears';

type SeedSchoolProperties = Omit<SchoolProperties, 'systems' | 'federalState' | 'currentYear'> & {
	id: string;
	updatedAt?: string;
	createdAt?: string;
	county?: {
		_id: ObjectId;
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
	logo_name?: string;
	enableStudentTeamCreation?: boolean;
};

const seedSchools: SeedSchoolProperties[] = [
	{
		id: '5f2987e020834114b8efd6f6',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Demo Schule',
		federalState: EFederalState.BRANDENBURG,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8813'),
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2017-08-24T12:04:11.721Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5f2987e020834114b8efd6f7',
		updatedAt: '2020-08-04T07:21:33.616Z',
		name: 'Schiller-Oberschule',
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5f2987e020834114b8efd6f8',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Paul-Gerhardt-Gymnasium',
		federalState: EFederalState.BRANDENBURG,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8812'),
			countyId: 12051,
			name: 'Brandenburg an der Havel',
			antaresKey: 'BRB',
		},
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [
			SchoolFeature.ROCKET_CHAT,
			SchoolFeature.LDAP_UNIVENTION_MIGRATION,
			SchoolFeature.VIDEOCONFERENCE,
			SchoolFeature.OAUTH_PROVISIONING_ENABLED,
		],
		enableStudentTeamCreation: false,
	},
	{
		id: '5f2987e020834114b8efd6f9',
		updatedAt: '2020-07-27T08:21:14.719Z',
		name: 'Expertenschule',
		federalState: EFederalState.BRANDENBURG,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8813'),
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2018-11-09T10:04:11.721Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.EXPERT,
		features: [SchoolFeature.ROCKET_CHAT, SchoolFeature.VIDEOCONFERENCE, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
	},
	{
		id: '5fa2c5ccb229544f2c69666c',
		updatedAt: '2020-11-04T21:58:25.254Z',
		name: 'Felix Mendelssohn-Gymnasium',
		federalState: EFederalState.BRANDENBURG,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8813'),
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2020-11-04T15:16:28.827Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeature.ROCKET_CHAT, SchoolFeature.STUDENTVISIBILITY, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		language: LanguageType.DE,
		logo_dataUrl: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fa318f2b229544f2c697a56',
		updatedAt: '2020-11-04T21:59:44.255Z',
		name: 'Ludwig van Beethoven-Liceum',
		federalState: EFederalState.BRANDENBURG,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8813'),
			countyId: 12052,
			name: 'Cottbus',
			antaresKey: 'CB',
		},
		createdAt: '2020-11-04T21:11:14.312Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeature.ROCKET_CHAT, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		language: LanguageType.DE,
		logo_dataUrl: '',
		logo_name: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fa31f3db229544f2c697e3e',
		updatedAt: '2020-11-04T21:54:10.847Z',
		name: 'Brasilien Schule',
		federalState: EFederalState.INTERNATIONAL_SCHOOL,
		createdAt: '2020-11-04T21:38:05.110Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			student: {
				LERNSTORE_VIEW: true,
			},
		},
		features: [SchoolFeature.ROCKET_CHAT, SchoolFeature.STUDENTVISIBILITY, SchoolFeature.OAUTH_PROVISIONING_ENABLED],
		documentBaseDirType: '',
		experimental: false,
		pilot: false,
		timezone: 'America/Belem',
		language: LanguageType.EN,
		logo_dataUrl: '',
		logo_name: '',
		officialSchoolNumber: '',
	},
	{
		id: '5fcfb0bc685b9af4d4abf899',
		updatedAt: '2020-12-08T16:58:36.527Z',
		name: 'school in Ni',
		federalState: EFederalState.NIEDERSACHSEN,
		county: {
			_id: new ObjectId('5fa55eb53f472a2d986c8812'),
			countyId: 3256,
			name: 'Nienburg/Weser',
			antaresKey: 'NI',
		},
		createdAt: '2020-12-08T16:58:36.527Z',
		systems: [],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
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
		features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
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
			_id: new ObjectId('5fa55eb53f472a2d986c8812'),
			countyId: 12051,
			name: 'Brandenburg an der Havel',
			antaresKey: 'BRB',
		},
		createdAt: '2017-01-01T00:06:37.148Z',
		systems: ['62c7f233f35a554ba3ed42f1'],
		fileStorageType: FileStorageType.AWS_S3,
		currentYear: SeedSchoolYearEnum['2022/23'],
		purpose: SchoolPurpose.DEMO,
		permissions: {
			teacher: {
				STUDENT_LIST: true,
			},
		},
		features: [
			SchoolFeature.OAUTH_PROVISIONING_ENABLED,
			SchoolFeature.LDAP_UNIVENTION_MIGRATION,
			SchoolFeature.VIDEOCONFERENCE,
			SchoolFeature.OAUTH_PROVISIONING_ENABLED,
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
		const currentYear = entities.schoolYears.find((sy) => partial.currentYear && sy.name === partial.currentYear);
		const systems = partial.systems
			?.map((systemId) => entities.systems.find((s) => s.id === systemId))
			.filter((s) => s) as SystemEntity[] | undefined;

		const federalState =
			entities.federalStates.find((fs) => partial.federalState && fs.name === partial.federalState) ??
			federalStateFactory.build();

		const params: DeepPartial<SchoolProperties> = {
			externalId: partial.externalId,
			features: partial.features,
			inMaintenanceSince: partial.inMaintenanceSince,
			name: partial.name,
			inUserMigration: partial.inUserMigration,
			officialSchoolNumber: partial.officialSchoolNumber,
			previousExternalId: partial.previousExternalId,
			userLoginMigration: partial.userLoginMigration,
			currentYear,
			systems,
			federalState,
		};
		const schoolEntity = schoolEntityFactory.buildWithId(params, partial.id);

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
		schoolEntity['logo_name'] = partial.logo_name;
		schoolEntity['enableStudentTeamCreation'] = partial.enableStudentTeamCreation;

		return schoolEntity;
	});
}
