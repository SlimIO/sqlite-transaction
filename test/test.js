// Require Node.js Dependencies
const { join } = require("path");
const { unlink, readFile } = require("fs").promises;

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
        const sql = await readFile(join(__dirname, "db.sql"), { encoding: "utf8" });
        db = await sqlite.open(DB);
        await db.exec(sql);
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

    test("registerSubject must throw TypeError if name is not a string or a symbol", (assert) => {
        const tM = new TransactionManager(db);
        try {
            tM.registerSubject(10);
        }
        catch (err) {
            assert.equal(err.message, "name should be typeof string or symbol");
        }
        tM.exit();
    });

    test("registerSubject must work as expected", (assert) => {
        const tM = new TransactionManager(db);
        const ret = tM.registerSubject("foo", "bar");
        assert.equal(ret === tM, true);
        assert.equal(tM.subjects.size, 1);
        assert.equal(tM.subjects.has("foo"), true);
        assert.equal(tM.subjects.get("foo"), "bar");
        tM.registerSubject("foo", "xd");
        assert.equal(tM.subjects.get("foo"), "bar");

        tM.exit();
    });
});
