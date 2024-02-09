import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AntivirusService } from '@src/infra/antivirus';
import { AuthorizationService } from '@src/modules/authorization';
import { Readable } from 'stream';
import { CommonCartridgeImportService, CourseService } from '../service';
import { LearnroomConfigService } from '../service/learnroom-config.service';

@Injectable()
export class CourseImportUc {
	public constructor(
		private readonly courseService: CourseService,
		private readonly configService: LearnroomConfigService,
		private readonly authorizationService: AuthorizationService,
		private readonly antivirusService: AntivirusService,
		private readonly courseImportService: CommonCartridgeImportService
	) {}

	public async importFromCommonCartridge(userId: EntityId, file: Buffer): Promise<void> {
		if (!this.configService.isCommonCartridgeImportEnabled) {
			throw new NotFoundException();
		}

		const result = await this.antivirusService.checkStream(Readable.from(file));

		if (result.virus_detected) {
			throw new BadRequestException('File contains malicious content');
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkAllPermissions(user, [Permission.COURSE_CREATE]);

		const course = this.courseImportService.createCourse(user, file);

		await this.courseService.create(course);
	}
}
