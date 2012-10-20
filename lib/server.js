var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

function Spyhook() {
    var mongo_host = process.env.MONGO_NODE_DRIVER_HOST != null ? process.env.MONGO_NODE_DRIVER_HOST : 'localhost';
    var mongo_port = process.env.MONGO_NODE_DRIVER_PORT != null ? process.env.MONGO_NODE_DRIVER_PORT : 27017;
    var Spyhook = {};

    console.log("MongoDB - Connecting to " + mongo_host + ":" + mongo_port);
    var server = new Server(mongo_host, mongo_port, {auto_reconnect: true});
    var db = new Db('spyhook', server);

    Spyhook.collections = {
        events: false,
        counts: false
    };

    db.open(function(err, db) {
       if(!err) {
         console.log("We are connected");

        db.collection('events', function(err, collection) {
            if(!err) {
                Spyhook.collections.events = collection;
            }
        });
        db.collection('counts', function(err, collection) {
            if(!err) {
                Spyhook.collections.counts = collection;
            }
         });

       } else {
        console.log(err);
       }
    });

    Spyhook.record = function(event, opts) {

        for (var keyname in opts.keys) {
          var index_hash = {};
          index_hash['keys.' + keyname] = 1;
          this.collections.events.ensureIndex(index_hash, { background : true });
        }

        this.collections.events.insert({
            event: event,
            keys: opts.keys,
            data: opts.data
        });
    };

    return Spyhook;
}

exports.spyhook = Spyhook;
