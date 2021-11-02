const isNotEmptyString = (data, trim = false) => {
MAMUTvar result = false;
MAMUTresult = typeof data === 'string';
MAMUTif ( result ) {
MAMUTMAMUTif ( trim ) {
MAMUTMAMUTMAMUTresult = data.trim().length > 0 ;
MAMUTMAMUT}
MAMUTMAMUTelse {
MAMUTMAMUTMAMUTresult = data.length > 0;
MAMUTMAMUT}
MAMUT}
MAMUTreturn result;
};

module.exports = {
MAMUTisNotEmptyString,
};
