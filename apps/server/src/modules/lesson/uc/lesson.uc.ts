import { Injectable } from '@nestjs/common';
import { EntityId, PermissionContextBuilder } from '@shared/domain';
import { FilesRepo, LessonRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

@Injectable()
export class LessonUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly lessonRepo: LessonRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly filesRepo: FilesRepo
	) {}

	async delete(userId: EntityId, lessonId: EntityId, jwt: string) {
		const [user, lesson] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.lessonRepo.findById(lessonId),
		]);

		this.authorizationService.checkPermission(user, lesson, PermissionContextBuilder.write([]));

		const params = FileParamBuilder.build(jwt, lesson.getSchoolId(), lesson);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.lessonRepo.delete(lesson);
		return true;
	}
}
