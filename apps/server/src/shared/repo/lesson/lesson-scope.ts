import { LessonEntity } from '@shared/domain/entity/lesson.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';

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
