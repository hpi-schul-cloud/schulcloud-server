import { ObjectId } from '@mikro-orm/mongodb';
import {
	AnyProvisioningOptions,
	SchoolSystemOptions,
	SchoolSystemOptionsProps,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { DomainObjectFactory } from '../domain-object.factory';

export const schoolSystemOptionsFactory = DomainObjectFactory.define<
	SchoolSystemOptions,
	SchoolSystemOptionsProps<AnyProvisioningOptions>
>(SchoolSystemOptions<AnyProvisioningOptions>, () => {
	return {
		id: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		systemId: new ObjectId().toHexString(),
		provisioningOptions: new SchulConneXProvisioningOptions().set({
			groupProvisioningClassesEnabled: true,
			groupProvisioningCoursesEnabled: false,
			groupProvisioningOtherEnabled: false,
			schoolExternalToolProvisioningEnabled: false,
		}),
	};
});
