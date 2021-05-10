import { Expose } from "class-transformer";
import { WithTimeStampBaseEntity } from "../../../shared/core/repo";
import { Document } from 'mongoose';

export class Lesson extends WithTimeStampBaseEntity {
	constructor(partial: Partial<Lesson>) {
		super();
		Object.assign(this, partial);
	}
}

export type ILesson = Document & Lesson;