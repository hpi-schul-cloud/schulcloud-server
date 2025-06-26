import { schoolEntityFactory } from '@modules/school/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { BaseFactory } from '@testing/factory/base.factory';
import { SchoolSystemOptionsEntity, SchoolSystemOptionsEntityProps } from '../entity';

export const schoolSystemOptionsEntityFactory = BaseFactory.define<
	SchoolSystemOptionsEntity,
	SchoolSystemOptionsEntityProps
>(SchoolSystemOptionsEntity, () => {
	return {
		school: schoolEntityFactory.buildWithId(),
		system: systemEntityFactory.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SCHULCONNEX_ASYNC }),
		provisioningOptions: {
			groupProvisioningOtherEnabled: false,
			groupProvisioningCoursesEnabled: false,
			groupProvisioningClassesEnabled: false,
			schoolExternalToolProvisioningEnabled: false,
		},
	};
});
