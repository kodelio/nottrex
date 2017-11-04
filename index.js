const env = process.env.NODE_ENV || 'development';
const config = require('./env')[env];
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nottrex', {
    useMongoClient: true
});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connected');
});

const bittrex = require('node.bittrex.api');
bittrex.options({
    'apikey': config.apikey,
    'apisecret': config.apisecret,
});

const Schema = mongoose.Schema;

let dbSchema = new Schema({
    size: Number
});

let DB = mongoose.model('db', dbSchema);

function check() {
    bittrex.sendCustomRequest('https://bittrex.com/api/v1.1/market/getopenorders', function (data, err) {
        DB.findOne({}, function (err, _data) {
            if (_data.size !== data.result.length) {
                DB.update({size: data.result.length}, function (err, obj) {
                    if (err) {
                        return next(err);
                    }
                    const PushBullet = require('pushbullet');
                    const pusher = new PushBullet(config.pushbullet);

                    pusher.devices({limit: 10}, function (error, response) {
                        for (let device in response.devices) {
                            pusher.note(device.iden, 'Bittrex order', 'Un changement a eu lieu', function (error, response) {

                            });
                        }
                    });
                });
            }
        });
    }, true);
}


setInterval(check, 30 * 1000);
