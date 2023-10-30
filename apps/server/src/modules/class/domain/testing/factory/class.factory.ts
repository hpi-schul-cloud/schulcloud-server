import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@shared/testing/factory/domainobject/do-base.factory';
import { DeepPartial } from 'fishery';
import { ClassSourceOptions } from '../../class-source-options.do';
import { Class, ClassProps } from '../../class.do';

class ClassFactory extends DoBaseFactory<Class, ClassProps> {
	withUserIds(userIds: string[]): this {
		const params: DeepPartial<ClassProps> = {
			userIds,
		};

		return this.params(params);
	}
}

export const classFactory = ClassFactory.define(Class, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `name-${sequence}`,
		schoolId: new ObjectId().toHexString(),
		userIds: [new ObjectId().toHexString(), new ObjectId().toHexString()],
		teacherIds: [new ObjectId().toHexString(), new ObjectId().toHexString()],
		invitationLink: `link-${sequence}`,
		year: new ObjectId().toHexString(),
		gradeLevel: sequence,
		ldapDN: `dn-${sequence}`,
		successor: new ObjectId().toHexString(),
		source: `source-${sequence}`,
		sourceOptions: new ClassSourceOptions({ tspUid: `id-${sequence}` }),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
