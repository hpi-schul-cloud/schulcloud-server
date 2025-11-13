/* istanbul ignore file */
import { Class } from '@modules/class';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { ExternalClassDto } from '../dto';

export class TspClassWithoutNameLoggable implements Loggable {
	constructor(private readonly scClass: Class, private readonly tspClass: ExternalClassDto) {}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'TSP_CLASS_WITHOUT_NAME',
			message: 'TSP class would be saved without a name.',
			data: {
				tspClass: {
					externalId: this.tspClass.externalId,
					name: this.tspClass.name,
					gradeLevel: this.tspClass.gradeLevel,
				},
				scClass: {
					id: this.scClass.id,
					name: this.scClass.name,
					schoolId: this.scClass.schoolId,
					createdAt: this.scClass.createdAt.toString(),
				},
			},
		};
	}
}
