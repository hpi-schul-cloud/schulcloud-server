const { Configuration } = require('@schul-cloud/commons');
const request = require('request-promise-native');

class MerlinTokenGenerator {
    constructor() {
        if (MerlinTokenGenerator.instance) {
            return MerlinTokenGenerator.instance;
        }
        this.username = Configuration.get('ES_MERLIN_USERNAME');
        this.password = Configuration.get('ES_MERLIN_PW');
        MerlinTokenGenerator.instance = this;
        if (!this.username || !this.password) {
            throw Error(`Missing env variables: \n ES_MERLIN_USERNAME:${this.username} \n ES_MERLIN_PW: ${this.password}`);
        }
    }

    async FIND(data) {
        const { merlinReference } = data.query
        let url = await this.getMerlinUrl(merlinReference)
        return url
    }

    static get Instance() {
        if (!MerlinTokenGenerator.instance) {
            return new MerlinTokenGenerator();
        }
        return MerlinTokenGenerator.instance;
    }

    getMerlinUrl = async ref => {
        const options = {
            'method': 'POST',
            'url': `http://merlin.nibis.de/auth.php?nbc&identifier=${ref}`,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form: {
                'username': this.username,
                'password': this.password
            }
        };
        try {
            const merlinUrl = await request(options)
            return merlinUrl
        } catch (e) {
            throw Error(`Failed to obtain merlin url. Error: ${e}`);
        }
    }

}

module.exports = MerlinTokenGenerator.Instance;