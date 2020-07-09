const { Configuration } = require('@schul-cloud/commons');

class EduSearchResponse {
	constructor(parsed) {
		this.total = 0;
		this.limit = 0;
		this.skip = 0;
		this.data = [];

		if (parsed) {
			// filter out the resources without the external url
			const filteredNodes = Configuration.get('FEATURE_ES_SHOW_ONLY_EXTERNAL_RESULTS')
				? parsed.nodes.filter((node) => {
					const location = node.properties['ccm:wwwurl'];
					return location && location.length > 0;
				}) : parsed.nodes;
			const totalDif = parsed.nodes.length - filteredNodes.length;
			this.total = parsed.pagination.total - totalDif;
			this.limit = parsed.pagination.count;
			this.skip = parsed.pagination.from;
			this.data = filteredNodes;
		}
	}
}

module.exports = EduSearchResponse;
