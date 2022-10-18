import {CourseService} from "@src/modules/learnroom/service/course.service";
import {EntityId} from "@shared/domain";
import { LessonService } from "@src/modules/lesson/service";

export class CourseExportService {
    constructor(private readonly courseService: CourseService, private readonly lessonService: LessonService) {
    }

    async create(name: EntityId): Promise<void> {
        throw new Error();
    }

    async export(courseId: EntityId): Promise<Buffer> {
        throw new Error();
    }
}