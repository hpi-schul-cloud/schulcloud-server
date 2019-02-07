
module.exports = function () {
	const app = this;
	const options = {
		Model: {},
		paginate: {
			default: 50,
			max: 100,
		},
		lean: true,
	};
};
