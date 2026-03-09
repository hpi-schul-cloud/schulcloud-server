import { EntityId } from '@shared/domain/types';

export class ImportCourseEvent {
	constructor(
		public readonly jwt: string,
		public readonly fileRecordId: EntityId,
		public readonly fileName: string,
		public readonly fileUrl: string
	) {}
}
