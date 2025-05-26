/* global describe, it */

var assert = require('assert')
var tenzura = require('../../')
var blockchain = require('./_blockchain')

var network = tenzura.networks.testnet
var alice = tenzura.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', network)
var bob = tenzura.ECPair.fromWIF('cMkopUXKWsEzAjfa1zApksGRwjVpJRB3831qM9W4gKZsLwjHXA9x', network)

describe('tenzurajs-lib (CLTV)', function () {
  var hashType = tenzura.Transaction.SIGHASH_ALL

  function cltvCheckSigOutput (aQ, bQ, utcSeconds) {
    return tenzura.script.compile([
      tenzura.opcodes.OP_IF,
      tenzura.script.number.encode(utcSeconds),
      tenzura.opcodes.OP_CHECKLOCKTIMEVERIFY,
      tenzura.opcodes.OP_DROP,

      tenzura.opcodes.OP_ELSE,
      bQ.getPublicKeyBuffer(),
      tenzura.opcodes.OP_CHECKSIGVERIFY,
      tenzura.opcodes.OP_ENDIF,

      aQ.getPublicKeyBuffer(),
      tenzura.opcodes.OP_CHECKSIG
    ])
  }

  function utcNow () {
    return Math.floor(Date.now() / 1000)
  }

  // expiry past, {Alice's signature} OP_TRUE
  it('where Alice can redeem after the expiry is past', function (done) {
    this.timeout(30000)

    // three hours ago
    var timeUtc = utcNow() - (3600 * 3)
    var redeemScript = cltvCheckSigOutput(alice, bob, timeUtc)
    var scriptPubKey = tenzura.script.scriptHash.output.encode(tenzura.crypto.hash160(redeemScript))
    var address = tenzura.address.fromOutputScript(scriptPubKey, network)

    // fund the P2SH(CLTV) address
    blockchain.t.faucet(address, 2e4, function (err, unspent) {
      if (err) return done(err)

      var tx = new tenzura.TransactionBuilder(network)
      tx.setLockTime(timeUtc)
      tx.addInput(unspent.txId, 0, 0xfffffffe)
      tx.addOutput(blockchain.t.RETURN, 1e4)

      var txRaw = tx.buildIncomplete()
      var signatureHash = txRaw.hashForSignature(0, redeemScript, hashType)

      // {Alice's signature} OP_TRUE
      var redeemScriptSig = tenzura.script.scriptHash.input.encode([
        alice.sign(signatureHash).toScriptSignature(hashType),
        tenzura.opcodes.OP_TRUE
      ], redeemScript)

      txRaw.setInputScript(0, redeemScriptSig)

      blockchain.t.transactions.propagate(txRaw.toHex(), done)
    })
  })

  // expiry ignored, {Bob's signature} {Alice's signature} OP_FALSE
  it('where Alice and Bob can redeem at any time', function (done) {
    this.timeout(30000)

    // two hours ago
    var timeUtc = utcNow() - (3600 * 2)
    var redeemScript = cltvCheckSigOutput(alice, bob, timeUtc)
    var scriptPubKey = tenzura.script.scriptHash.output.encode(tenzura.crypto.hash160(redeemScript))
    var address = tenzura.address.fromOutputScript(scriptPubKey, network)

    // fund the P2SH(CLTV) address
    blockchain.t.faucet(address, 2e4, function (err, unspent) {
      if (err) return done(err)

      var tx = new tenzura.TransactionBuilder(network)
      tx.addInput(unspent.txId, 0, 0xfffffffe)
      tx.addOutput(blockchain.t.RETURN, 1e4)

      var txRaw = tx.buildIncomplete()
      var signatureHash = txRaw.hashForSignature(0, redeemScript, hashType)
      var redeemScriptSig = tenzura.script.scriptHash.input.encode([
        alice.sign(signatureHash).toScriptSignature(hashType),
        bob.sign(signatureHash).toScriptSignature(hashType),
        tenzura.opcodes.OP_FALSE
      ], redeemScript)

      txRaw.setInputScript(0, redeemScriptSig)

      blockchain.t.transactions.propagate(txRaw.toHex(), done)
    })
  })

  // expiry in the future, {Alice's signature} OP_TRUE
  it('fails when still time-locked', function (done) {
    this.timeout(30000)

    // two hours from now
    var timeUtc = utcNow() + (3600 * 2)
    var redeemScript = cltvCheckSigOutput(alice, bob, timeUtc)
    var scriptPubKey = tenzura.script.scriptHash.output.encode(tenzura.crypto.hash160(redeemScript))
    var address = tenzura.address.fromOutputScript(scriptPubKey, network)

    // fund the P2SH(CLTV) address
    blockchain.t.faucet(address, 2e4, function (err, unspent) {
      if (err) return done(err)

      var tx = new tenzura.TransactionBuilder(network)
      tx.setLockTime(timeUtc)
      tx.addInput(unspent.txId, 0, 0xfffffffe)
      tx.addOutput(blockchain.t.RETURN, 1e4)

      var txRaw = tx.buildIncomplete()
      var signatureHash = txRaw.hashForSignature(0, redeemScript, hashType)

      // {Alice's signature} OP_TRUE
      var redeemScriptSig = tenzura.script.scriptHash.input.encode([
        alice.sign(signatureHash).toScriptSignature(hashType),
        tenzura.opcodes.OP_TRUE
      ], redeemScript)

      txRaw.setInputScript(0, redeemScriptSig)

      blockchain.t.transactions.propagate(txRaw.toHex(), function (err) {
        assert.throws(function () {
          if (err) throw err
        }, /Error: 64: non-final/)

        done()
      })
    })
  })
})
