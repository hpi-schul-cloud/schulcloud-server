import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { CommonCartridgeImportService } from '../service';

@Injectable()
@EventsHandler(ImportCourseEvent)
export class CommonCartridgeImportHandler implements IEventHandler<ImportCourseEvent> {
	constructor(private readonly importService: CommonCartridgeImportService) {}

	public async handle(event: ImportCourseEvent): Promise<void> {
		await this.importService.importCourse(event);
	}
}
