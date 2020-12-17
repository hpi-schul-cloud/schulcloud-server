/* eslint no-console: 0 */
/* eslint no-confusing-arrow: 0 */
const ran = true; // set to true to exclude migration
const name = 'Add privacy access rights for users.';

const database = require('../../src/utils/database');

const RoleModel = require('../../src/services/role/model');
const { ConsentVersionModel } = require('../../src/services/consent/model');

const run = async () => {
	database.connect();

	const userRoles = await RoleModel.find({ name: { $in: ['user', 'demo'] } }).exec();
	const addPermissions = ['PRIVACY_VIEW'];

	const chain = [];

	// update user roles/permissions
	chain.push(
		userRoles.map((userRole) =>
			Promise.all(
				addPermissions.map((permission) => {
					if (!userRole.permissions.includes(permission)) {
						console.log(`add permission ${permission} for userrole ${userRole.name}`);
						return RoleModel.findByIdAndUpdate(userRole._id, { $push: { permissions: permission } }).exec();
					}
					console.log(`${permission} already exists for userRole ${userRole.name}`);
					return Promise.resolve();
				})
			)
		)
	);

	// add chat information to consentversions
	const publishedAt = new Date('2019-05-13');
	// use static id to not add this entry again on possible second run
	const exist = await ConsentVersionModel.findOne({ publishedAt, consentTypes: 'privacy' }).exec();
	if (!exist) {
		console.log('add consent version for chat');
		chain.push(
			new ConsentVersionModel({
				title: 'Neue Chatfunktion',
				consentTypes: ['privacy'],
				consentText: `Die neue Funktion „Teams“ ist verfügbar. 
Innerhalb der Teams könnt ihr zusätzlich zum Dateiaustausch, 
Gruppenterminen und Gruppennews einen Chat hinzufügen und so teamweite Nachrichten versenden, 
sofern der Admin deiner Schule die Nutzung der Chatfunktion grundsätzlich freigeschaltet hat. 
				
Der Chat ist direkt am HPI gehostet, was bedeutet, 
dass deine Daten jederzeit auf unseren Servern liegen und zu 
keinem Zeitpunkt an Dritte weitergegeben werden. 
Außerdem besteht eine verschlüsselte Netzverbindung zwischen dem 
Server am HPI und dem Client (SSL-Verschlüsselung).
				
Bei Rückfragen kannst du dich jederzeit an Deine Schule oder an 
<a href="info@hpi-schul-cloud.de">info@hpi-schul-cloud.de</a> wenden. 
Weitere Hinweise zur Datenverarbeitung  findest 
Du in der oben verlinkten Datenschutzerklärung deiner Schule.`,
				publishedAt,
			}).save()
		);
	} else {
		console.log('consent version already added');
	}

	return Promise.all(chain);
};

module.exports = {
	ran,
	name,
	run,
};
