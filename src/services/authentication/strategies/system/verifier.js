class SystemVerifier {
	constructor(app, options = {}) {
		this.app = app;
		this.options = options;

		if (!options.loginStrategy) {
			throw new Error(`You must implement a loginStrategy and pass it as class in the options.`);
		}

		this.loginStrategy = new options.loginStrategy(app);
		this.verify = this.verify.bind(this);
	}

	//Create LDAP username
	_getUsername({ username, password, systemId, strategy, schoolId }) {
		return this.app.service('schools').get(schoolId)
			.then(school => {
				if (strategy == 'ldap') {
					return school.ldapSchoolIdentifier + '/' + username;
				} else {
					return username;
				}
			});
	}

	// either get an existing account or create a new one #SSO
	_getAccount({ username, password, systemId, strategy, schoolId }) {
		return this.app.service('/accounts').find({
			paginate: false,
			query: {
				username,
				systemId
			}
		}).then(accounts => {
			if (accounts.length) {
				return accounts[0];
			} else {
				// create account
				return this.app.service('/accounts').create({
					username,
					password,
					systemId,
					strategy,
					schoolId
				});
			}
		});
	}

	verify(req, done) {
		const { username, password, systemId, strategy, schoolId } = req.body;

		this._getUsername({ username, password, systemId, strategy, schoolId })
			.then(username => {
				this.app.service('/systems').get(systemId).then(system => {
					return this.loginStrategy.login({ username, password }, system, schoolId);
				}).then(_ => {
					// credentials are valid at this point => get or create account
					return this._getAccount({
						username: username.toLowerCase(),
						password,
						systemId,
						strategy,
						schoolId
					}).then(account => {
						const payload = {
							accountId: account._id,
							userId: account.userId
						};
						done(null, account, payload);
					});

				}).catch(err => {
					done();
				});
			});
	}
}

module.exports = SystemVerifier;
