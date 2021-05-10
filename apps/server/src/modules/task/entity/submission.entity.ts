import { Expose } from "class-transformer";
import { WithTimeStampBaseEntity } from "../../../shared/core/repo";
import { Document } from 'mongoose';

export class Submission extends WithTimeStampBaseEntity {
	constructor(partial: Partial<Submission>) {
		super();
		Object.assign(this, partial);
	}
	
	homeworkId: string;
}

export type ISubmission = Document & Submission;