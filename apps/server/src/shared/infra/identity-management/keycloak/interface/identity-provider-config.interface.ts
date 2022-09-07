import { System } from '@shared/domain';
import { SysType } from '../../sys.type';

export interface IIdentityProviderConfig extends Omit<System, 'url' | 'oauthConfig' | 'ldapConfig'> {
	type: SysType;
	alias: string;
	displayName: string | undefined;
}
