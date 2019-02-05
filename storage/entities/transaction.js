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

const _ = require('lodash');
const { stringToByte } = require('../utils/inputSerializers');
const { NonSupportedOperationError } = require('../errors');
const filterTypes = require('../utils/filter_types');
const BaseEntity = require('./base_entity');

/**
 * Basic Transaction
 * @typedef {Object} BasicTransaction
 * @property {string} id
 * @property {string} blockId
 * @property {Integer} [height]
 * @property {Integer} [confirmations]
 * @property {Integer} type
 * @property {Number} timestamp
 * @property {string} senderPublicKey
 * @property {string} [recipientPublicKey]
 * @property {string} requesterPublicKey
 * @property {string} senderId
 * @property {string} recipientId
 * @property {string} amount
 * @property {string} fee
 * @property {string} signature
 * @property {string} signSignature
 * @property {Array.<string>} signatures
 * @property {json} asset
 */

/**
 * Transfer Transaction
 * @typedef {BasicTransaction} TransferTransaction
 * @property {Object} asset
 * @property {string} asset.data
 */

/**
 * Second Passphrase Transaction
 * @typedef {BasicTransaction} SecondPassphraseTransaction
 * @property {Object} asset
 * @property {Object} asset.signature
 * @property {string} asset.signature.publicKey
 */

/**
 * Delegate Transaction
 * @typedef {BasicTransaction} DelegateTransaction
 * @property {Object} asset
 * @property {Object} asset.delegate
 * @property {string} asset.delegate.username
 */

/**
 * Vote Transaction
 * @typedef {BasicTransaction} VoteTransaction
 * @property {Object} asset
 * @property {Array.<string>} asset.votes
 */

/**
 * Multisig Registration Transaction
 * @typedef {BasicTransaction} MultisigRegistrationTransaction
 * @property {Object} asset
 * @property {Object} asset.multisignature
 * @property {Integer} asset.multisignature.min
 * @property {Integer} asset.multisignature.lifetime
 * @property {Array.<string>} asset.multisignature.keysgroup
 */

/**
 * Dapp Registration Transaction
 * @typedef {BasicTransaction} DappRegistrationTransaction
 * @property {Object} asset
 * @property {Object} asset.dapp
 * @property {Integer} asset.dapp.type
 * @property {string} asset.dapp.name
 * @property {string} asset.dapp.description
 * @property {string} asset.dapp.tags
 * @property {string} asset.dapp.link
 * @property {string} asset.dapp.icon
 * @property {Integer} asset.dapp.category
 */

/**
 * InTransfer Transaction
 * @typedef {BasicTransaction} InTransferTransaction
 * @property {Object} asset
 * @property {Object} asset.inTransfer
 * @property {string} asset.inTransfer.dappId
 */

/**
 * OutTransfer Transaction
 * @typedef {BasicTransaction} OutTransferTransaction
 * @property {Object} asset
 * @property {Object} asset.outTransfer
 * @property {string} asset.outTransfer.dappId
 * @property {string} asset.outTransfer.transactionId
 */

/**
 * Transaction
 * @typedef {(TransferTransaction|SecondPassphraseTransaction|DelegateTransaction|VoteTransaction|MultisigRegistrationTransaction|DappRegistrationTransaction|InTransferTransaction|OutTransferTransaction)} Transaction
 */

/**
 * Transaction Filters
 * @typedef {Object} filters.Transaction
 */

const sqlFiles = {
	select: 'transactions/get.sql',
	selectExtended: 'transactions/get_extended.sql',
	isPersisted: 'transactions/is_persisted.sql',
	count: 'transactions/count.sql',
	count_all: 'transactions/count_all.sql',
	create: 'transactions/create.sql',
};

class Transaction extends BaseEntity {
	/**
	 * Constructor
	 * @param {BaseAdapter} adapter - Adapter to retrive the data from
	 * @param {filters.Transaction} defaultFilters - Set of default filters applied on every query
	 */
	constructor(adapter, defaultFilters = {}) {
		super(adapter, defaultFilters);

		this.addField('rowId', 'string', {
			fieldName: 'trs.rowId',
		});

		this.addField('id', 'string', {
			filter: filterTypes.TEXT,
			fieldName: 'trs.id',
		});

		this.addField('blockId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('blockHeight', 'string', {
			filter: filterTypes.NUMBER,
			fieldName: 'height',
		});

		this.addField('type', 'number', {
			filter: filterTypes.NUMBER,
		});

		this.addField('timestamp', 'number', {
			filter: filterTypes.NUMBER,
			fieldName: 'trs.timestamp',
		});

		this.addField(
			'senderPublicKey',
			'string',
			{
				filter: filterTypes.TEXT,
				format: 'publicKey',
			},
			stringToByte
		);

		this.addField(
			'recipientPublicKey',
			'string',
			{
				filter: filterTypes.TEXT,
				format: 'publicKey',
				fieldName: 'm.publicKey',
			},
			stringToByte
		);

		this.addField(
			'requesterPublicKey',
			'string',
			{
				filter: filterTypes.TEXT,
				format: 'publicKey',
			},
			stringToByte
		);

		this.addField('senderId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('recipientId', 'string', {
			filter: filterTypes.TEXT,
		});

		this.addField('amount', 'string', {
			filter: filterTypes.NUMBER,
		});

		this.addField('fee', 'string', {
			filter: filterTypes.NUMBER,
		});

		this.addField('signature', 'string', {}, stringToByte);

		this.addField('signSignature', 'string', {}, stringToByte);

		this.addField('signatures', 'string');

		this.addField('asset', 'string');

		this.addFilter('data_like', filterTypes.CUSTOM, {
			condition: "asset->>'data' LIKE ${data_like}",
		});

		this.addFilter('dapp_name', filterTypes.CUSTOM, {
			condition: "asset->'dapp'->>'name' = ${dapp_name}",
		});

		this.addFilter('dapp_link', filterTypes.CUSTOM, {
			condition: "asset->'dapp'->>'link' = ${dapp_link}",
		});

		this.SQLs = this.loadSQLFiles('transaction', sqlFiles);
	}

	/**
	 * Get one transaction
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [options = {}] - Options to filter data
	 * @param {Number} [options.limit=10] - Number of records to fetch
	 * @param {Number} [options.offset=0] - Offset to start the records
	 * @param {string} [options.sort] - Sort key for transaction e.g. amount:asc, amount:desc
	 * @param {Boolean} [options.extended=false] - Get extended fields for entity
	 * @param {Object} tx - Database transaction object
	 * @return {Promise.<Transaction, Error>}
	 */
	getOne(filters, options = {}, tx) {
		const expectedResultCount = 1;
		return this._getResults(filters, options, tx, expectedResultCount);
	}

	/**
	 * Get list of transactions
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [options = {}] - Options to filter data
	 * @param {Number} [options.limit=10] - Number of records to fetch
	 * @param {Number} [options.offset=0] - Offset to start the records
	 * @param {string} [options.sort] - Sort key for transaction e.g. amount:asc, amount:desc
	 * @param {Boolean} [options.extended=false] - Get extended fields for entity
	 * @param {Object} tx - Database transaction object
	 * @return {Promise.<Transaction[], Error>}
	 */
	get(filters, options = {}, tx) {
		return this._getResults(filters, options, tx);
	}

	/**
	 * Count transactions
	 *
	 * @param {filters.Transaction|filters.Transaction[]} [filters = {}]
	 * @param {Object} [_options = {}] - Options to filter data
	 * @param {Object} [tx] - Database transaction object
	 * @return {Promise.<Transaction[], Error>}
	 */
	// eslint-disable-next-line no-unused-vars
	count(filters, _options = {}, tx) {
		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		const params = {
			parsedFilters,
		};
		const expectedResultCount = 1;

		const sql = parsedFilters === '' ? this.SQLs.count_all : this.SQLs.count;

		return this.adapter
			.executeFile(sql, params, { expectedResultCount }, tx)
			.then(data => +data.count);
	}

	/**
	 * Create transactions object
	 *
	 * @param {Transaction|Array.<Transaction>} data
	 * @param {Object} [_options]
	 * @param {Object} [tx] - Transaction object
	 * @return {*}
	 */
	create(data, _options, tx) {
		let transactions = _.cloneDeep(data);

		if (!Array.isArray(transactions)) {
			transactions = [transactions];
		}

		transactions.forEach(t => {
			t.signatures = t.signatures ? t.signatures.join() : null;
			t.amount = t.amount.toString();
			t.fee = t.fee.toString();
			t.recipientId = t.recipientId || null;
			t.asset = t.asset ? JSON.stringify(t.asset) : null;
		});

		const trsFields = [
			'id',
			'blockId',
			'type',
			'timestamp',
			'senderPublicKey',
			'requesterPublicKey',
			'senderId',
			'recipientId',
			'amount',
			'fee',
			'signature',
			'signSignature',
			'signatures',
			'asset',
		];

		const createSet = this.getValuesSet(transactions, trsFields);

		return this.adapter.executeFile(
			this.SQLs.create,
			{ values: createSet, attributes: trsFields },
			{ expectedResultCount: 0 },
			tx
		);
	}

	/**
	 * Update the records based on given condition
	 *
	 * @param {filters.Account} [filters]
	 * @param {Object} data
	 * @param {Object} [options]
	 * @param {Object} [tx] - Transaction object
	 * @return {*}
	 */
	// eslint-disable-next-line class-methods-use-this,no-unused-vars
	update(filters, data, options, tx) {
		throw new NonSupportedOperationError(
			'Updating transaction is not supported.'
		);
	}

	/**
	 * Update one record based on the condition given
	 *
	 * @param {filters.Account} filters
	 * @param {Object} data
	 * @param {Object} [options]
	 * @param {Object} [tx] - Transaction object
	 * @return {*}
	 */
	// eslint-disable-next-line class-methods-use-this,no-unused-vars
	updateOne(filters, data, options, tx) {
		throw new NonSupportedOperationError(
			'Updating transaction is not supported.'
		);
	}

	/**
	 * Delete operation is not supported for Transactions
	 *
	 * @override
	 * @throws {NonSupportedOperationError}
	 */
	// eslint-disable-next-line class-methods-use-this
	delete() {
		throw new NonSupportedOperationError();
	}

	/**
	 * Check if the record exists with following conditions
	 *
	 * @param {filters.Account} filters
	 * @param {Object} [_options]
	 * @param {Object} [tx]
	 * @returns {Promise.<boolean, Error>}
	 */
	isPersisted(filters, _options, tx) {
		const atLeastOneRequired = true;
		this.validateFilters(filters, atLeastOneRequired);
		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		return this.adapter
			.executeFile(
				this.SQLs.isPersisted,
				{ parsedFilters },
				{ expectedResultCount: 1 },
				tx
			)
			.then(result => result.exists);
	}

	_getResults(filters, options, tx, expectedResultCount = undefined) {
		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		const parsedOptions = _.defaults(
			{},
			_.pick(options, ['limit', 'offset', 'sort', 'extended']),
			_.pick(this.defaultOptions, ['limit', 'offset', 'sort', 'extended'])
		);

		// To have deterministic pagination add extra sorting
		if (parsedOptions.sort) {
			parsedOptions.sort = _.flatten([parsedOptions.sort, 'rowId:asc']).filter(
				Boolean
			);
		} else {
			parsedOptions.sort = ['rowId:asc'];
		}

		let parsedSort = this.parseSort(parsedOptions.sort);
		parsedSort = parsedSort.replace('"dapp_name"', "asset->'dapp'->>'name'");

		const params = {
			limit: parsedOptions.limit,
			offset: parsedOptions.offset,
			parsedSort,
			parsedFilters,
		};

		return this.adapter
			.executeFile(
				parsedOptions.extended ? this.SQLs.selectExtended : this.SQLs.select,
				params,
				{ expectedResultCount },
				tx
			)
			.then(resp => {
				if (expectedResultCount === 1) {
					resp.asset = resp.asset ? resp.asset : {};
					return resp;
				}

				resp.forEach(item => {
					item.asset = item.asset ? item.asset : {};
				});
				return resp;
			});
	}
}

module.exports = Transaction;