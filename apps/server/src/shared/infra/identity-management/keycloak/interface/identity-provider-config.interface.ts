import { System } from '@shared/domain';
import { SysType } from '../../sys.type';

export interface IIdentityProviderConfig extends Omit<System, 'oauthConfig' | 'url'> {
	type: SysType;
	alias: string;
}
