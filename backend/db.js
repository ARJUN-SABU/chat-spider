const { MongoClient } = require("mongodb");

let dbConnection;

let uri =
  "mongodb+srv://arjunsabu99:arjun-chat-spider-99@cluster0.zbepgqh.mongodb.net/chat-spider-database?retryWrites=true&w=majority";

module.exports = {
  connectToDb: (cb) => {
    MongoClient.connect(uri)
      .then((client) => {
        dbConnection = client.db();
        return cb();
      })
      .catch((err) => {
        console.log(err);
        return cb(err);
      });
  },
  getDb: () => dbConnection,
};