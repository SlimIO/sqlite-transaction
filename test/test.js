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

    test("loadSubjectsFromFile, fileLocation must be a string", async(assert) => {
        const tM = new TransactionManager(db);
        try {
            await tM.loadSubjectsFromFile(null);
        }
        catch (err) {
            assert.equal(err.message, "fileLocation should be typeof string!");
        }

        tM.exit();
    });

    test("loadSubjectsFromFile, fileLocation extension must be .json", async(assert) => {
        const tM = new TransactionManager(db);
        try {
            await tM.loadSubjectsFromFile("./local.txt");
        }
        catch (err) {
            assert.equal(err.message, "Only JSON file are supported!");
        }

        tM.exit();
    });

    test("loadSubjectsFromFile must work as expected", async(assert) => {
        const tM = new TransactionManager(db);
        const ret = await tM.loadSubjectsFromFile(join(__dirname, "req.json"));
        assert.equal(ret, void 0);
        assert.equal(tM.subjects.has("sub1"), true);
        assert.equal(tM.subjects.has("sub2"), true);
        const action = tM.subjects.get("sub1");
        assert.equal(action.insert, "...");

        tM.exit();
    });

    test("open() - unknown Action must throw Error", async(assert) => {
        const tM = new TransactionManager(db);
        try {
            tM.open("yahou");
        }
        catch (err) {
            assert.equal(err.message, "Unknown action yahou");
        }

        tM.exit();
    });

    test("open() - subject must Exist", async(assert) => {
        const tM = new TransactionManager(db);
        try {
            tM.open("insert", "bouh!");
        }
        catch (err) {
            assert.equal(err.message, "Unknown subject with name bouh!");
        }

        tM.exit();
    });

    test("open() - action must exist on the requested subject", async(assert) => {
        const tM = new TransactionManager(db);
        tM.registerSubject("test", { insert: "..." });
        try {
            tM.open("update", "test");
        }
        catch (err) {
            assert.equal(err.message, "Action with name update is not defined on subject test");
        }

        tM.exit();
    });

    test("open a transaction to insert a new User", async(assert) => {
        assert.plan(6);
        const tM = new TransactionManager(db, {
            interval: 500
        });
        tM.registerSubject("user", {
            insert: "INSERT INTO users (username, password) VALUES (?, ?)"
        });

        tM.once("user.insert", () => {
            assert.equal(1, 1);
        });

        const tId = tM.open("insert", "user", ["fraxken", "admin"]);
        assert.equal(typeof tId, "string");
        assert.equal(tM.transactions.has(tId), true);
        assert.equal(tM.size, 1);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const row = await db.get("SELECT * FROM users WHERE username=?", "fraxken");
        assert.equal(row.id, 1);
        assert.equal(row.password, "admin");
        await db.run("DELETE FROM users WHERE id=?", row.id);

        tM.exit();
    });

    test("close(transactId) must return false if the tId doesn't exist!", async(assert) => {
        const tM = new TransactionManager(db);
        const ret = tM.close("test");
        assert.equal(ret, false);

        tM.exit();
    });

    test("close opened transaction", async(assert) => {
        const tM = new TransactionManager(db);
        tM.registerSubject("user", {
            insert: "INSERT INTO users (username, password) VALUES (?, ?)"
        });

        const tId = tM.open("insert", "user", ["fraxken", "admin"]);
        const ret = tM.close(tId);
        assert.equal(ret, true);

        tM.exit();
    });
});
