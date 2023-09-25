import { EntityId } from '@shared/domain';

export interface LdapConfig {
	active?: boolean;
	federalState?: EntityId;
	lastSyncAttempt?: Date;
	lastSuccessfulFullSync?: Date;
	lastSuccessfulPartialSync?: Date;
	lastModifyTimestamp?: string;
	url: string;
	rootPath?: string;
	searchUser?: string;
	searchUserPassword?: string;
	provider?: string;
	providerOptions?: {
		schoolName?: string;
		userPathAdditions?: string;
		classPathAdditions?: string;
		roleType?: string;
		userAttributeNameMapping?: {
			givenName?: string;
			sn?: string;
			dn?: string;
			uuid?: string;
			uid?: string;
			mail?: string;
			role?: string;
		};
		roleAttributeNameMapping?: {
			roleStudent?: string;
			roleTeacher?: string;
			roleAdmin?: string;
			roleNoSc?: string;
		};
		classAttributeNameMapping?: {
			description?: string;
			dn?: string;
			uniqueMember?: string;
		};
	};
}
