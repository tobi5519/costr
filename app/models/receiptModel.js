var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var receiptsSchema   = new Schema({
    service_id: String,
    type: String,
    data: Number,
    timestamp: Date,
    price_rate: Number
});

module.exports = mongoose.model('receipts', receiptsSchema);
