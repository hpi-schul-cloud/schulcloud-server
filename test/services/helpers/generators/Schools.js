const AbstractGenerator = require('./AbstractGenerator');

class Schools extends AbstractGenerator {
    constructor(app) {
        super(app);
        this._service = app.service('schools');
    }

    async create({
                     name = `HPI-Testschule-${new Date().getTime()}`,
                     address = {},
                     fileStorageType,
                     systems = [],
                     federalState,
                     ldapSchoolIdentifier,
                     createdAt = Date.now(),
                     updatedAt = Date.now(),
                     experimental = false,
                     pilot = false,
                     currentYear,
                     schoolGroupId,
                     documentBaseDirType,
                     // eslint-disable-next-line camelcase
                     logo_dataUrl,
                     purpose = 'test',
                     rssFeeds = [],
                     features = [],
                     customYears = [],
                     inMaintenanceSince = undefined,
                     source = undefined,
                     sourceOptions = undefined,
                     enableStudentTeamCreation = undefined,
                     permissions = undefined,
                     language = 'de',
                     timezone = 'Europe/Berlin',
                     storageProvider = undefined,
                 } = {}) {

        const result = await this._service.create({
            name,
            address,
            fileStorageType,
            systems,
            federalState,
            ldapSchoolIdentifier,
            documentBaseDirType,
            createdAt,
            schoolGroupId,
            customYears,
            updatedAt,
            experimental,
            pilot,
            currentYear,
            // eslint-disable-next-line camelcase
            logo_dataUrl,
            purpose,
            rssFeeds,
            features,
            inMaintenanceSince,
            source,
            sourceOptions,
            enableStudentTeamCreation,
            permissions,
            language,
            timezone,
            storageProvider,
        });

        this._createdEntitiesIds.push(result._id.toString());
        return result;
    }
}

Object.freeze(Schools);
module.exports = Schools;