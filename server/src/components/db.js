// Re-export from new location for backward compatibility with setup scripts
const { db, usersManager } = require("../db/connection");

exports.db = db;
exports.usersManager = usersManager;
