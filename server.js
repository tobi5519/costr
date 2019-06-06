var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var _ = require('lodash');

var Receipt = require("./app/models/receiptModel");
var Price = require("./app/models/priceModel");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var mongoose = require("mongoose");
var mongoDB = "";
mongoose.connect(mongoDB, { useNewUrlParser: true });

mongoose.set('useFindAndModify', false);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
});

var router = express.Router();

router.use(function(req, res, next) {
  next();
});

router.get("/", function(req, res) {
  res.json({
    Welcome: "This is the root of the API. To use the API follow these guidelines:",
    Costs: [{GET: ["/costs/:service_id", "/costs/:service_id/:type", "http://localhost:8080/api/costs/:service_id/?startdate=1970-01-01T00:00:00.000&enddate=2019-06-30T12:00:00.000", "http://localhost:8080/api/costs/:service_id/:type?startdate=1970-01-01T00:00:00.000&enddate=2019-06-30T12:00:00.000"]}],
    Prices: [{GET: ["/prices"], POST: ["/prices"]}],
    Services: [{GET: ["/services"]}],
    Usages: [{GET: ["/usages"], POST: ["/usages"], PUT: ["/usages/:_id"], DELETE: ["/usages/:_id"]}],
  });
});

router
  .route("/usages/:_id?")
  .get(function(req, res) {

    if (req.params._id) {
      Receipt.findById(req.params._id, function(err, receipt) {
        if (err) res.send(err);
        res.json(receipt);
      });
    }

    Receipt.find(function(err, receipts) {
      if (err) res.send(err);
      res.json(receipts);
    });
  })

  .post(function(req, res) {  
    
    Price.find({type: req.body.type}, function(err, data){
      var receipt = new Receipt();

      receipt.service_id = req.body.service_id;
      receipt.type = req.body.type;
      receipt.data = req.body.data;
      receipt.timestamp = new Date()      
      receipt.price_rate = data[0].price_rate;
      
      receipt.save(function(err) {
        if (err) {
          res.send(err);
        }
        res.json({ message: "receipt saved" });
      });
    })
  })

  // For testing
  .put(function(req, res) {
    Receipt.findById(req.params._id, function(err, receipt) {

      if (err) res.send(err);

      for (prop in req.body) {
        receipt[prop] = req.body[prop];
      }

      receipt.save(function(err) {
        if (err) res.send(err);
        res.json({ message: "receipt updated" });
      });
    });
  })

  // For testing 
  .delete(function(req, res) {
    Receipt.deleteOne({_id: req.params._id}, function(err, receipt) {
        if (err) res.send(err);
        res.json({ message: "receipt deleted" });
      }
    );
  });

router
  .route("/costs/:service_id/:type?")
  .get(function(req, res) {
    
    Receipt.find({ service_id: req.params.service_id },
                 function(err, receipt) {
      if (err) res.send(err);
      
      if (req.query.startdate && req.query.enddate) {

        var startdate = new Date(req.query.startdate);
        var enddate = new Date(req.query.enddate);

        receipt = _.filter(receipt, function(o) {
          return o.timestamp.getTime() >= startdate.getTime() &&
                 o.timestamp.getTime() <= enddate.getTime();
        })
      }

      if (req.params.type) {
                
        receipt = _.filter(receipt, function(o) {
          return o.type == req.params.type;
        })
      }
      
      var tmpsum = [];
      for (const i of receipt) {
        tmpsum.push(i.data * i.price_rate);
      }

      sum = _.sum(tmpsum);
    res.json(sum/100)
  });
});

router
  .route("/services")
  .get(function(req, res) {
    Receipt.find(function(err, receipts) {
      if (err) res.send(err);

      var services = [];
      for (const i of receipts) {
        services.push(i.service_id);
      }

      services = _.uniq(services);
      
      res.json(services);
    });
  });

router
  .route("/prices")
  .get(function(req, res) {
    Price.find(function(err, prices) {
      if (err) res.send(err);
      res.json(prices);
    });
  })
  .post(function(req, res) {
    Price.find({type: req.body.type}, function(err, data){
        
        if (data == ""){
            
            var price = new Price()
            price.type = req.body.type;
            price.price_rate = req.body.price_rate;
            price.last_change = new Date() 

            price.save(function(err, data){
                res.send({method: 'new price created'})
            });
        } else {  
            req.body.last_change = new Date();
            
            Price.findByIdAndUpdate(
              data[0]._id,
              req.body,
              function(err, data){
                res.send({method: 'price updated'})
            });
        };
      })
    })

app.use("/api", router);

app.listen(port);
console.log("Server running on " + port);
