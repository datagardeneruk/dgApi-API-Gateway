var constants = require('../constants/constants');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

var MONGO_DB_CONNECTION_URL = `mongodb://${encodeURI(constants.MONGO_DB_USER)}:${(constants.MONGO_DB_PWD)}@${constants.MONGO_URL_OFF}/${constants.MONGO_DATABASE_NAME}`; // this is URL used with credentials
// var MONGO_DB_CONNECTION_URL='mongodb://growDG#readWrite:#|r0|n#t##CDun#2019@mongo-primary-node:52498,mongo-secondary-node-one:52498,mongo-secondary-node-two:52498/data-gardener_Live?replicaSet=mongo-cluster';
// var MONGO_DB_CONNECTION_URL = `mongodb://${constants.MONGO_URL_OFF}/${constants.MONGO_DATABASE_NAME}`; //  this is URL used only without credentials

/*DB Connect*/
function mongoConnect() {
    mongoose.connection.openUri(
        MONGO_DB_CONNECTION_URL,
        function(err) {
            if (err) {
                console.error("Error: ", err);
            }
            console.log("Connected.... Unless You See An Error The Line Before This..!!");
        });
    mongoose.set('debug', true);
}
/*DB Connect ends*/

/* Drop Collection */
function dropCollection(collectionName) {
    mongoose.connection.openUri(
        MONGO_DB_CONNECTION_URL,
        function(err) {
            if (err) {
                console.error("Error: ", err);
            }
            mongoose.connection.dropCollection(collectionName, function(err){
                if (err) throw err;
                console.log("Collection " + collectionName + " deleted successfully..!!");
            });
        });
}
/* Drop Collection Ends*/

function dgsafeConnection(uri) {
    const db =  mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    db.on('error', function (error) {
        console.log(`MongoDB : connection ${this.name} ${JSON.stringify(error)}`);
        db.close().catch(() => console.log(`MongoDB : failed to close connection ${this.name}`));
    });

    db.on('connected', function () {
        mongoose.set('debug', function (col, method, query, doc) {
            console.log(`MongoDB : ${this.conn.name} - ${col}.${method}(${JSON.stringify(query)},${JSON.stringify(doc)})`);
        });
        console.log(`MongoDB : Connected ${this.name}`);
    });

    db.on('disconnected', function () {
        console.log(`MongoDB : Disconnected ${this.name}`);
    });

    return db;
};

module.exports = { mongoConnect, dropCollection, dgsafeConnection};
