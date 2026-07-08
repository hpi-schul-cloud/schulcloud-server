import { type EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { type LessonEntity } from './lesson.entity';

export class LessonScope extends Scope<LessonEntity> {
	public byCourseIds(courseIds: EntityId[]): LessonScope {
		this.addQuery({ course: { $in: courseIds } });
		return this;
	}

	public byHidden(isHidden: boolean): LessonScope {
		this.addQuery({ hidden: { $eq: isHidden } });
		return this;
	}
}
