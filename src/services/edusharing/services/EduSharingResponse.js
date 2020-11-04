class EduSharingResponse {
	constructor(parsed) {
		this.total = 0;
		this.limit = 0;
		this.skip = 0;
		this.data = [];

		if (parsed) {
			this.total = parsed.pagination.total;
			this.limit = parsed.pagination.count;
			this.skip = parsed.pagination.from;
			this.data = parsed.nodes;
		}
	}
}

module.exports = EduSharingResponse;
