const unique = (...permissions) => ([...new Set(Array.prototype.concat.apply([], permissions))]);

module.exports = unique;
