import { EntityId } from '@shared/domain/types';

type ProviderOptions = {
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

export class LdapConfig {
	active: boolean;

	url: string;

	provider?: string;

	federalState?: EntityId;

	lastSyncAttempt?: Date;

	lastSuccessfulFullSync?: Date;

	lastSuccessfulPartialSync?: Date;

	lastModifyTimestamp?: string;

	rootPath?: string;

	searchUser?: string;

	searchUserPassword?: string;

	providerOptions?: ProviderOptions;

	constructor(props: LdapConfig) {
		this.active = props.active;
		this.url = props.url;
		this.provider = props.provider;
		this.federalState = props.federalState;
		this.lastSyncAttempt = props.lastSyncAttempt;
		this.lastSuccessfulFullSync = props.lastSuccessfulFullSync;
		this.lastSuccessfulPartialSync = props.lastSuccessfulPartialSync;
		this.lastModifyTimestamp = props.lastModifyTimestamp;
		this.rootPath = props.rootPath;
		this.searchUser = props.searchUser;
		this.searchUserPassword = props.searchUserPassword;
		this.providerOptions = props.providerOptions;
	}
}
