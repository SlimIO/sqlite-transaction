// Require Node.js Dependencies
const { join } = require("path");
const { unlink } = require("fs").promises;

// Require Third-party Dependencies
const test = require("japa");
const sqlite = require("sqlite");
const is = require("@slimio/is");

// Require Internal
const TransactionManager = require("../");

// CONSTANTS
const DB = join(__dirname, "test.db");

test.group("SQLite-transaction", (group) => {
    /** @type {TransactionManager.Database} */
    let db;

    group.before(async() => {
        db = await sqlite.open(DB);
    });

    group.after(async() => {
        await db.close();
        await unlink(DB);
    });

    test("TransactionManager constructor (without options)", (assert) => {
        const tM = new TransactionManager(db);
        assert.equal(tM.verbose, false);
        assert.equal(is.map(tM.subjects), true);
        assert.equal(is.map(tM.transactions), true);
        assert.equal(tM.subjects.size, 0);
        assert.equal(tM.transactions.size, 0);
        assert.equal(typeof tM.timer, "number");

        tM.exit();
        assert.equal(is.undefined(tM.timer), true);
    });

    test("TransactionManager constructor (with verbose true)", (assert) => {
        const tM = new TransactionManager(db, {
            verbose: true
        });
        assert.equal(tM.verbose, true, "Verbose must be true");

        tM.exit();
    });
});
