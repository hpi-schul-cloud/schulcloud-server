import { Injectable } from '@nestjs/common';
import { Course, User } from '@shared/domain/entity';
import { CommonCartridgeFileParser } from '@src/modules/common-cartridge/import';

@Injectable()
export class CommonCartridgeImportService {
	public importCourse(user: User, file: Buffer): Promise<Course> {
		const parser = new CommonCartridgeFileParser(file);
		const course = new Course({ school: user.school, name: parser.manifest.getTitle() });

		return Promise.resolve(course);
	}
}
