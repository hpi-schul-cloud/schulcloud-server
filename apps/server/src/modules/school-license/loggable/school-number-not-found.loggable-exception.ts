import { NotFoundException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SchoolNumberNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly schoolId: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Required school number for media school licenses request is missing.',
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
