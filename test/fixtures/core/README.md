Description
------------

This directory contains data-driven tests for various aspects of Tenzura.


Ravencoinjs-lib notes
-------------------

This directory does not contain all the Tenzura core tests.
Missing core test data includes:

* `alertTests.raw`
	Tenzura-js does not interact with the Tenzura network directly.

* `tx_invalid.json`
	Tenzura-js can not evaluate Scripts, making testing this irrelevant.
	It can decode valid Transactions, therefore `tx_valid.json` remains.

* `script*.json`
	Tenzura-js can not evaluate Scripts, making testing this irrelevant.


License
--------

The data files in this directory are

		Copyright (c) 2018 MSFTserver
    Copyright (c) 2012-2014 The Bitcoin Core developers
    Distributed under the MIT/X11 software license, see the accompanying
    file COPYING or http://www.opensource.org/licenses/mit-license.php.
