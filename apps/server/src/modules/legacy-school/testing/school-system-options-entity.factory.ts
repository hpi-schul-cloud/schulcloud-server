import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { BaseFactory } from '@testing/factory/base.factory';
import { schoolEntityFactory } from '@testing/factory/school-entity.factory';
import { systemEntityFactory } from '@testing/factory/systemEntityFactory';
import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '../entity';

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
