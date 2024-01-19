import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '@modules/legacy-school/entity';
import { SystemProvisioningStrategy } from '../../domain/interface/system-provisioning.strategy';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { systemEntityFactory } from './systemEntityFactory';

export const schoolSystemOptionsEntityFactory = BaseFactory.define<
	SchoolSystemOptionsEntity,
	SchoolSystemOptionsEntityProps
>(SchoolSystemOptionsEntity, () => {
	return {
		school: schoolFactory.buildWithId(),
		system: systemEntityFactory.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }),
		provisioningOptions: {
			groupProvisioningOtherEnabled: false,
			groupProvisioningCoursesEnabled: false,
			groupProvisioningClassesEnabled: false,
		},
	};
});
