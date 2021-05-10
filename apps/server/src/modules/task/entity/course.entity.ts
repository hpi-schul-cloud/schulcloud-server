import { Expose } from "class-transformer";
import { WithTimeStampBaseEntity } from "../../../shared/core/repo";
import { Document } from 'mongoose';

export class Course extends WithTimeStampBaseEntity {
	constructor(partial: Partial<Course>) {
		super();
		Object.assign(this, partial);
	}

	name: string
	color: string
}

export type ICourse = Document & Course;