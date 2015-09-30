var crypto = require('crypto');
var crc = require('crc');

exports.getHash = getHash;
exports.getCRC = getCRC;

function getHash (entry) {
    return crypto.createHash('md5').update(JSON.stringify(entry)).digest('hex');
}

/**
 * Works much faster as hash but with similar results. Has higher probability of clashes.
 *
 * @param entry
 */
function getCRC(entry) {
    return crc.crc32(JSON.stringify(entry)).toString(16);
}