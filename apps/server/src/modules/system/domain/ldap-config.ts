import { type EntityId } from '@shared/domain/types';

export class LdapConfig {
	public active: boolean;

	public url: string;

	public provider?: string;

	public federalState?: EntityId;

	public lastSyncAttempt?: Date;

	public lastSuccessfulFullSync?: Date;

	public lastSuccessfulPartialSync?: Date;

	public lastModifyTimestamp?: string;

	public rootPath?: string;

	public searchUser?: string;

	public searchUserPassword?: string;

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
	}
}
