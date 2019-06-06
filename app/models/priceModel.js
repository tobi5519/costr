var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var priceSchema = new Schema({
    type: String,
    price_rate: Number,
    last_change: Date
});

module.exports = mongoose.model("priceList", priceSchema);
