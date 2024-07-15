import { SystemDeletedEvent, SystemType } from '@modules/system/domain';
import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { School } from '../do';
import { SchoolService } from '../service';

@Injectable()
@EventsHandler(SystemDeletedEvent)
export class SystemDeletedHandler implements IEventHandler<SystemDeletedEvent> {
	constructor(private readonly schoolService: SchoolService) {}

	public async handle(event: SystemDeletedEvent): Promise<void> {
		const school: School = await this.schoolService.getSchoolById(event.schoolId);

		school.removeSystem(event.system.id);
		school.ldapLastSync = undefined;

		if (event.system.type === SystemType.LDAP && school.systems.length === 0) {
			school.externalId = undefined;
		}

		await this.schoolService.save(school);
	}
}
