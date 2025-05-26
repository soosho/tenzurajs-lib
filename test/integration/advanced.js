/* global describe, it */

var tenzura = require('../../')
var blockchain = require('./_blockchain')

describe('tenzurajs-lib (advanced)', function () {
  it('can create an OP_RETURN transaction', function (done) {
    this.timeout(30000)

    var network = tenzura.networks.testnet
    var keyPair = tenzura.ECPair.makeRandom({ network: network })
    var address = keyPair.getAddress()

    blockchain.t.faucet(address, 5e4, function (err, unspent) {
      if (err) return done(err)

      var tx = new tenzura.TransactionBuilder(network)
      var data = Buffer.from('tenzurajs-lib')
      var dataScript = tenzura.script.nullData.output.encode(data)

      tx.addInput(unspent.txId, unspent.vout)
      tx.addOutput(dataScript, 1000)
      tx.addOutput(blockchain.t.RETURN, 4e4)
      tx.sign(0, keyPair)
      var txRaw = tx.build()

      blockchain.t.transactions.propagate(txRaw.toHex(), done)
    })
  })
})
