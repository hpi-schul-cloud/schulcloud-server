import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { type AnyProvisioningOptions } from './school-system-options.do';
import { SchulConneXProvisioningOptions } from './schulconnex-provisionin-options.do';

export const provisioningStrategyOptions: Map<SystemProvisioningStrategy, new () => AnyProvisioningOptions> = new Map([
	[SystemProvisioningStrategy.SANIS, SchulConneXProvisioningOptions],
]);
