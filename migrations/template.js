require('../src/services/user/model');

module.exports = {
	up: async function up() {
		// Make changes to the database here.
		// Hint: Access models via this('modelName'), not the imported model to have
		// access to the correct database connection. Otherwise Mongoose calls never return.
		await this('user').findOneAndUpdate({
			firstName: 'Marla',
			lastName: 'Mathe',
		}, {
			firstName: 'Max',
		}).lean().exec();
	},

	down: async function down() {
		// Implement the necessary steps to roll back the migration here.
		await this('user').findOneAndUpdate({
			firstName: 'Max',
			lastName: 'Mathe',
		}, {
			firstName: 'Marla',
		}).lean().exec();
	},
};
