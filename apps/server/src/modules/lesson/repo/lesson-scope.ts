import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { LessonEntity } from './lesson.entity';

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
