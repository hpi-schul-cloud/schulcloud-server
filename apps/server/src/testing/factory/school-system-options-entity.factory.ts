import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '@modules/legacy-school/entity';
import { SystemProvisioningStrategy } from '../../domain/interface/system-provisioning.strategy';
import { BaseFactory } from './base.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { systemEntityFactory } from './systemEntityFactory';

export const schoolSystemOptionsEntityFactory = BaseFactory.define<
	SchoolSystemOptionsEntity,
	SchoolSystemOptionsEntityProps
>(SchoolSystemOptionsEntity, () => {
	return {
		school: schoolEntityFactory.buildWithId(),
		system: systemEntityFactory.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }),
		provisioningOptions: {
			groupProvisioningOtherEnabled: false,
			groupProvisioningCoursesEnabled: false,
			groupProvisioningClassesEnabled: false,
			schoolExternalToolProvisioningEnabled: false,
		},
	};
});
