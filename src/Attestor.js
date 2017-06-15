const ipfsAPI = require('ipfs-api');
const stringify = require('json-stable-stringify');
const fs = require('fs');

const STANDARD_ATTESTATION = {
  defaultLikelihood: '0.30'
}

class Attestor {
  constructor(web3) {
    this.web3 = web3;
    this.ipfs = ipfsAPI('ipfs', '5001', { protocol: 'http' });
  }

  getAttestationCommitment(uuid, callback) {
    let attestation = STANDARD_ATTESTATION;
    attestation['uuid'] = uuid;
    const data = stringify(attestation);
    const signature = this.web3.eth.sign('ac7f7b63d1d6e311695693235eb3262f60fea079', data);
    attestation['r'] = signature.substr(0,64);
    attestation['s'] = signature.substr(64,128);
    attestation['v'] = signature.substr(128,130);

    const filePath = "/attestations/" + uuid;
    fs.writeFile(filePath, attestation, function(err) {
      if(err) {
        return callback(err);
      }

      ipfs.file.add({
        path: filePath,
        content: fs.createReadStream(filePath),
      }, function(err, res) {
          if (err) {
            callback(err)
          } else {
            callback(res.hash)
          }
      })
    })
  }
}

module.exports = Attestor;
