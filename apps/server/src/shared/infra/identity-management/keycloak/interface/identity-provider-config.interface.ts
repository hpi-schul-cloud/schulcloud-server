import { SystemType } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

export interface IIdentityProviderConfig extends Omit<SystemDto, 'url' | 'oauthConfig' | 'ldapConfig'> {
	type: SystemType;
	alias: string;
	displayName: string | undefined;
}
