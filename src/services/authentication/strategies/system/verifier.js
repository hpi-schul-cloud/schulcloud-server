class SystemVerifier {
	constructor(app, options = {}) {
		this.app = app;
		this.options = options;

		if (!options.loginStrategy) {
			throw new Error('You must implement a loginStrategy and pass it as class in the options.');
		}
		// eslint-disable-next-line new-cap
		this.loginStrategy = new options.loginStrategy(app); // ToDo: fix lint
		this.verify = this.verify.bind(this);
	}

	// Create LDAP username
	getUsername({
		username, password, systemId, strategy, schoolId,
	}) {
		return this.app.service('schools').get(schoolId)
			.then((school) => {
				if (strategy === 'ldap') {
					return `${school.ldapSchoolIdentifier}/${username}`;
				}
				return username;
			});
	}

	// either get an existing account or create a new one #SSO
	getAccount({
		username, password, systemId, strategy, schoolId,
	}) {
		return this.app.service('/accounts').find({
			paginate: false,
			query: {
				username,
				systemId,
			},
		}).then((accounts) => {
			if (accounts.length) {
				return accounts[0];
			}
			// create account
			return this.app.service('/accounts').create({
				username,
				password,
				systemId,
				strategy,
				schoolId,
			});
		});
	}

	verify(req, done) {
		const {
			username, password, systemId, strategy, schoolId,
		} = req.body;

		this.getUsername({
			username, password, systemId, strategy, schoolId,
		})
			// eslint-disable-next-line no-shadow
			.then((username) => { // Todo solve linter
				this.app.service('/systems').get(systemId)
					.then(system => this.loginStrategy.login({ username, password }, system, schoolId))
					.then(() => this.getAccount({
						username: username.toLowerCase(),
						password,
						systemId,
						strategy,
						schoolId,
					}).then((account) => {
						const payload = {
							accountId: account._id,
							userId: account.userId,
						};
						done(null, account, payload);
					}))
					.catch((err) => {
						done();
					});
			});
	}
}

module.exports = SystemVerifier;
