import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { CommonCartridgeFileParser } from '@src/modules/common-cartridge/import';

@Injectable()
export class CommonCartridgeImportService {
	public createCourse(user: User, file: Buffer): Course {
		const parser = new CommonCartridgeFileParser(file);
		const course = new Course({ teachers: [user], school: user.school, name: parser.manifest.getTitle() });

		return course;
	}
}
