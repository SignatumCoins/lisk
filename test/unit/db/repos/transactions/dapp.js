/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const DBSandbox = require('../../../../common/db_sandbox').DBSandbox;
const transactionsFixtures = require('../../../../fixtures/index').transactions;
const seeder = require('../../../../common/db_seed');
const transactionTypes = require('../../../../../helpers/transaction_types');

const numSeedRecords = 5;

let db;
let dbSandbox;
let dappRepo;

describe('db', () => {
	before(done => {
		dbSandbox = new DBSandbox(
			__testContext.config.db,
			'lisk_test_db_transactions_dapp'
		);

		dbSandbox.create((err, __db) => {
			db = __db;
			dappRepo = db['transactions.dapp'];
			done(err);
		});
	});

	after(done => {
		dbSandbox.destroy();
		done();
	});

	beforeEach(done => {
		seeder
			.seed(db)
			.then(() => done())
			.catch(done);
	});

	afterEach(done => {
		sinonSandbox.restore();
		seeder
			.reset(db)
			.then(() => done(null))
			.catch(done);
	});

	it('should initialize db.blocks repo', () => {
		return expect(dappRepo).to.be.not.null;
	});

	describe('DappsTransactionsRepo', () => {
		describe('constructor()', () => {
			it('should assign param and data members properly', () => {
				expect(dappRepo.db).to.be.eql(db);
				expect(dappRepo.pgp).to.be.eql(db.$config.pgp);
				expect(dappRepo.dbTable).to.be.eql('dapps');
				expect(dappRepo.dbFields).to.be.eql([
					'type',
					'name',
					'description',
					'tags',
					'link',
					'category',
					'icon',
					'transactionId',
				]);

				expect(dappRepo.cs).to.be.an('object');
				expect(dappRepo.cs).to.not.empty;
				return expect(dappRepo.cs).to.have.all.keys('insert');
			});
		});

		describe('save()', () => {
			it('should insert entry into "dapps" table for type 5 transactions', function*() {
				const block = seeder.getLastBlock();
				const transactions = [];
				for (let i = 0; i < numSeedRecords; i++) {
					transactions.push(
						transactionsFixtures.Transaction({
							blockId: block.id,
							type: transactionTypes.DAPP,
						})
					);
				}
				yield db.transactions.save(transactions);

				const result = yield db.query('SELECT * FROM dapps');

				expect(result).to.not.empty;
				expect(result).to.have.lengthOf(numSeedRecords);
				expect(result.map(r => r.transactionId)).to.be.eql(
					transactions.map(t => t.id)
				);
				return expect(result).to.be.eql(transactions.map(t => t.asset.dapp));
			});
		});
	});
});
