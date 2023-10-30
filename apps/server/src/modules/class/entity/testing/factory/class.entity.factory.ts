import { DeepPartial } from 'fishery';

import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ObjectId } from 'bson';
import { ClassSourceOptionsEntity } from '../../class-source-options.entity';
import { ClassEntity, IClassEntityProps } from '../../class.entity';

class ClassEntityFactory extends BaseFactory<ClassEntity, IClassEntityProps> {
	withUserIds(userIds: ObjectId[]): this {
		const params: DeepPartial<IClassEntityProps> = {
			userIds,
		};

		return this.params(params);
	}
}

export const classEntityFactory = ClassEntityFactory.define(ClassEntity, ({ sequence }) => {
	return {
		name: `name-${sequence}`,
		schoolId: new ObjectId(),
		userIds: new Array<ObjectId>(),
		teacherIds: [new ObjectId(), new ObjectId()],
		invitationLink: `link-${sequence}`,
		year: new ObjectId(),
		gradeLevel: sequence,
		ldapDN: `dn-${sequence}`,
		successor: new ObjectId(),
		source: `source-${sequence}`,
		sourceOptions: new ClassSourceOptionsEntity({ tspUid: `id-${sequence}` }),
	};
});
