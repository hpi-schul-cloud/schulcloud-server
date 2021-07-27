import { Injectable, Inject } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { ValidationError } from '@shared/common';
import { Course } from '../entity';

export interface CourseRepoInterface {
	getCourseOfUser(userId: EntityId): Promise<Counted<Course[]>>;
}

const isValidEntityString = (id: EntityId) => {
	return id.length === 24;
};

@Injectable()
export class CourseUC {
	err = {
		invalidUserId: 'An invalid userId is passing as parameter.',
	};

	constructor(@Inject('CourseRepo') readonly repo: CourseRepoInterface) {}

	checkIfValidEntityString(userId: EntityId): void {
		if (!isValidEntityString(userId)) {
			throw new ValidationError(this.err.invalidUserId, { userId });
		}
	}

	async findAllCoursesFromUserByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		this.checkIfValidEntityString(userId);

		const [courses, count] = await this.repo.getCourseOfUser(userId);
		return Promise.resolve([courses, count]);
	}
}
