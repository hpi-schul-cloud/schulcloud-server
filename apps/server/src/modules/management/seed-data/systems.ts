/* eslint-disable no-template-curly-in-string */
import { SystemEntityProps } from '@modules/system/repo';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { DeepPartial } from 'fishery';
import { systemEntityFactory } from './factory/system.entity.factory';

type SystemPartial = DeepPartial<SystemEntityProps> & {
	id?: string;
	createdAt?: string;
	updatedAt?: string;
};

const data: SystemPartial[] = [];

export function generateSystems(injectEnvVars: (s: string) => string) {
	const systems = data.map((d) => {
		d = JSON.parse(injectEnvVars(JSON.stringify(d))) as typeof d;
		const params: DeepPartial<SystemEntityProps> = {
			alias: d.alias,
			displayName: d.displayName,
			type: d.type,
			provisioningStrategy: d.provisioningStrategy,
			oidcConfig: d.oidcConfig,
			ldapConfig: d.ldapConfig,
			oauthConfig: d.oauthConfig,
			provisioningUrl: d.provisioningUrl,
			url: d.url,
		};
		const system = systemEntityFactory.buildWithId(params, d.id);

		if (d.createdAt) system.createdAt = new Date(d.createdAt);
		if (d.updatedAt) system.updatedAt = new Date(d.updatedAt);

		return system;
	});

	return systems;
}
