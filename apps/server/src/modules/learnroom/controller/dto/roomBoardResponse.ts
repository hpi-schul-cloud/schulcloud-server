// TODO: this and DashboardResponse should be combined

export class BoardResponse {
	constructor({ content }: BoardResponse) {
		this.content = content;
	}

	content: [];
}
