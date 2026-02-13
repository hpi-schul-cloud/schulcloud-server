import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { JwtExtractor } from '@shared/common/utils';
import { Request } from 'express';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';

@Injectable()
export class CommonCartridgeProducer {
	constructor(private readonly eventBus: EventBus, @Inject(REQUEST) private readonly request: Request) {}

	public importCourse(params: ImportCourseParams): void {
		const jwt = JwtExtractor.extractJwtFromRequest(this.request);

		if (!jwt) {
			throw new UnauthorizedException();
		}

		this.eventBus.publish(new ImportCourseEvent(jwt, params.fileRecordId, params.fileName, params.fileUrl));
	}
}
