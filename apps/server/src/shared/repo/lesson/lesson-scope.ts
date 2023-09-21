import { EntityId, LessonEntity } from '@shared/domain';
import { Scope } from '../scope';

export class LessonScope extends Scope<LessonEntity> {
	byCourseIds(courseIds: EntityId[]): LessonScope {
		this.addQuery({ course: { $in: courseIds } });
		return this;
	}

	byHidden(isHidden: boolean): LessonScope {
		this.addQuery({ hidden: { $eq: isHidden } });
		return this;
	}
}
