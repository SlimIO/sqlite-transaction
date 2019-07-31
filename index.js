"use strict";

// Require Node.js dependencies
const { EventEmitter } = require("events");
const { readFile } = require("fs").promises;
const { extname } = require("path");
const { randomBytes } = require("crypto");

// Require Third-party Dependencies
const timer = require("@slimio/timer");

// CONSTANTS
const DEFAULT_INTERVAL_MS = 5000;
const ACTIONS = new Set(["insert", "update", "delete"]);
const TRANSACT = Symbol("TRANSACT");

/** @typedef {(string|symbol)} Subject */

/**
 * @typedef {object} Actions
 * @property {string} insert
 * @property {string} delete
 * @property {string} update
 */

/**
 * @typedef {object} Transaction
 * @property {number} index
 * @property {Actions} action
 * @property {Subject} subject
 * @property {number} openAt Transaction Creation timestamp
 * @property {any} attachData
 * @property {any[]} data
 */

/**
 * @class TransactManager
 * @augments EventEmitter
 *
 * @property {*} db SQLite DB ref
 * @property {number} timer Interval Timer ID
 * @property {Map<string, Actions>} subjects
 * @property {Map<string, Transaction>} transactions
 */
class TransactManager extends EventEmitter {
    /**
     * @class
     * @param {*} db SQLite db
     * @param {object} [options] options object
     * @param {number} [options.interval=5000] Transaction Interval
     * @param {boolean} [options.verbose=false] Enable verbose mode
     */
    constructor(db, options = Object.create(null)) {
        super();
        this.db = db;
        this.verbose = typeof options.verbose === "boolean" ? options.verbose : false;

        /** @type {Map<string, Actions>} */
        this.subjects = new Map();

        /** @type {Map<string, Transaction>} */
        this.transactions = new Map();

        // Set non-enumerable TRANSACT property
        Reflect.defineProperty(this, TRANSACT, {
            enumerable: false,
            value: []
        });

        // Create the Transaction interval
        const intervalMs = typeof options.interval === "number" ? options.interval : DEFAULT_INTERVAL_MS;
        this.timer = timer.setInterval(async() => {
            /** @type {string[]} */
            const qtArr = this[TRANSACT];
            if (this.verbose) {
                console.log(`Run transaction with ${qtArr.length} element!`);
            }

            // If there is no open transaction (then, just return)
            if (qtArr.length === 0) {
                return;
            }

            let tLen = qtArr.length;
            while (tLen--) {
                const transactId = qtArr.shift();
                const { subject, action, data, attachData, openAt } = this.transactions.get(transactId);

                const SQLQuery = this.subjects.get(subject)[action];
                this.db.run(SQLQuery, ...data);
                this.transactions.delete(transactId);
                this.emit(`${subject}.${action}`, openAt, data, attachData);
            }
        }, intervalMs);
    }

    /**
     * @function size
     * @description Size of open transactions
     * @returns {number}
     */
    get size() {
        return this.transactions.size;
    }

    /**
     * @version 0.1.0
     *
     * @async
     * @function loadSubjectsFromFile
     * @description Load subjects from a .JSON file
     * @memberof TransactManager#
     * @param {!string} fileLocation file location on the local disk
     * @returns {Promise<void>}
     *
     * @throws {TypeError}
     * @throws {Error}
     */
    async loadSubjectsFromFile(fileLocation) {
        if (typeof fileLocation !== "string") {
            throw new TypeError("fileLocation should be typeof string!");
        }
        if (extname(fileLocation) !== ".json") {
            throw new Error("Only JSON file are supported!");
        }

        const buf = await readFile(fileLocation);
        const query = JSON.parse(buf.toString());

        for (const [subject, actions] of Object.entries(query)) {
            this.registerSubject(subject, actions);
        }
    }

    /**
     * @version 0.1.0
     *
     * @function registerSubject
     * @description Add a new transaction subject
     * @memberof TransactManager#
     * @param {!Subject} name subject name
     * @param {!Actions} actions available actions for the given subject
     * @returns {TransactManager}
     *
     * @throws {TypeError}
     *
     * @example
     * const transact = new TransactManager(db);
     * transact.registerSubject("alarm", {
     *     insert: "INSERT INTO ...",
     *     delete: "DELETE FROM alarms WHERE cid = ?"
     * });
     */
    registerSubject(name, actions) {
        const tName = typeof name;
        if (tName !== "string" && tName !== "symbol") {
            throw new TypeError("name should be typeof string or symbol");
        }
        if (!this.subjects.has(name)) {
            this.subjects.set(name, actions);
        }

        return this;
    }

    /**
     * @version 0.1.0
     *
     * @function open
     * @memberof TransactManager#
     * @param {!string} action action name
     * @param {!Subject} subject subject
     * @param {any[]} data data to be publish
     * @returns {string}
     *
     * @throws {Error}
     */
    open(action, subject, data) {
        if (!ACTIONS.has(action)) {
            throw new Error(`Unknown action ${action}`);
        }
        if (!this.subjects.has(subject)) {
            throw new Error(`Unknown subject with name ${subject}`);
        }
        const tSub = this.subjects.get(subject);
        if (!Reflect.has(tSub, action)) {
            throw new Error(`Action with name ${action} is not defined on subject ${subject}`);
        }

        // Generate transactId
        const transactId = randomBytes(16).toString();
        const openAt = Date.now();
        if (this.verbose) {
            console.log(`Open new transaction (${subject}.${action}) with uid ${transactId}`);
        }

        const index = this[TRANSACT].push(transactId);
        this.transactions.set(transactId, {
            action, subject, data, index, openAt
        });

        return transactId;
    }

    /**
     * @version 0.1.0
     *
     * @function attachData
     * @description Attach a payload to a given transaction
     * @memberof TransactManager#
     * @param {!string} transactId transaction id
     * @param {*} data custom data to attach to the transaction
     * @returns {boolean}
     */
    attachData(transactId, data) {
        if (!this.transactions.has(transactId)) {
            return false;
        }

        const tr = this.transactions.get(transactId);
        Reflect.set(tr, "attachData", data);

        return true;
    }

    /**
     * @version 0.1.0
     *
     * @function close
     * @description Close a given transaction by ID
     * @memberof TransactManager#
     * @param {!string} transactId transaction id
     * @returns {boolean}
     *
     * @throws {Error}
     */
    close(transactId) {
        if (!this.transactions.has(transactId)) {
            return false;
        }

        const { index } = this.transactions.get(transactId);
        this[TRANSACT].splice(index, 1);

        return true;
    }

    /**
     * @function exit
     * @description Exit and liberate all ressources of the TransactionManager (timer etc..)
     * @memberof TransactManager#
     * @returns {void}
     */
    exit() {
        timer.clearInterval(this.timer);
        this.timer = undefined;
    }
}

/**
 * @static
 * @readonly
 * @memberof TransactManager#
 * @type {object}
 * @property {string} Insert
 * @property {string} Update
 * @property {string} Delete
 */
TransactManager.Actions = Object.freeze({
    Insert: "insert",
    Update: "update",
    Delete: "delete"
});

module.exports = TransactManager;
