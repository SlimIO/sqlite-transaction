// Require Node.js Dependencies
const { join } = require("path");
const { unlink } = require("fs").promises;

// Require Third-party Dependencies
const test = require("japa");
const sqlite = require("sqlite");

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

    test("Create a new TransactionManager", (assert) => {
        assert.equal(true, true);
    });
});
