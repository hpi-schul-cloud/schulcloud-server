import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { ExternalSchoolDto } from '../dto';

export const externalSchoolDtoFactory = Factory.define<ExternalSchoolDto, ExternalSchoolDto>(
	({ sequence }) =>
		new ExternalSchoolDto({
			externalId: new ObjectId().toHexString(),
			name: `External School ${sequence}`,
		})
);
