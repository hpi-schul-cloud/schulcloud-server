import { System, ISystemProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const systemFactory = BaseFactory.define<System, ISystemProperties>(System, ({ sequence }) => {
	return {
		type: 'ldap',
	};
});
