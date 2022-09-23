import { System, SystemType } from '@shared/domain';

export interface IIdentityProviderConfig extends Omit<System, 'url' | 'oauthConfig' | 'ldapConfig'> {
	type: SystemType;
	alias: string;
	displayName: string | undefined;
}
