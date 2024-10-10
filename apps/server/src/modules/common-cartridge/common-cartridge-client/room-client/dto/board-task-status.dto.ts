export class BoardTaskStatusDto {
	submitted: number;

	maxSubmissions: number;

	graded: number;

	isDraft: boolean;

	isSubstitutionTeacher: boolean;

	isFinished: boolean;

	constructor(props: BoardTaskStatusDto) {
		this.submitted = props.submitted;
		this.maxSubmissions = props.maxSubmissions;
		this.graded = props.graded;
		this.isDraft = props.isDraft;
		this.isSubstitutionTeacher = props.isSubstitutionTeacher;
		this.isFinished = props.isFinished;
	}
}
