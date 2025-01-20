import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalSchoolDto } from '@modules/provisioning/dto';
import { BaseFactory } from '@testing/factory/base.factory';

class ExternalSchoolDtoFactory extends BaseFactory<ExternalSchoolDto, Readonly<ExternalSchoolDto>> {}

export const externalSchoolDtoFactory = ExternalSchoolDtoFactory.define(ExternalSchoolDto, ({ sequence }) => {
	return {
		externalId: new ObjectId().toHexString(),
		name: `External School ${sequence}`,
	};
});
