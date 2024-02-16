//all logic to connect to MongoDB is done here

const dotenv = require("dotenv")
dotenv.config();

const cds = require("@sap/cds");
const { ObjectId } = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const uri = process.env.MONGO_URI;
const db_name = "mycapmongo"
const client = new MongoClient(uri)
const objectId = require("mongodb").ObjectId


async function _createCustomer(req){
    await client.connect();

    var db = await client.db(db_name)
    var customer = await db.collection("customer")
    var results = await customer.insertOne(req.data)

    if(results.insertedId){
        req.data.id = "inserted"
    }

    return req.data;
    
}

async function _getAllCustomers(req){
    await client.connect();

    var db = await client.db(db_name)

    var filter, limit, offset;

    if(req.query.SELECT.one){
        var sId = req.query.SELECT.from.ref[0].where[2].val;  //this is used to fetch one record
        filter = {_id: new ObjectId(sId)}
    }

    if (req.query.SELECT.limit) {
        limit = parseInt(req.query.SELECT.limit.rows.val);
        if (isNaN(limit)) {
            throw new Error("Invalid $top parameter");
        }
        if (req.query.SELECT.limit.offset) {
            offset = parseInt(req.query.SELECT.limit.offset.val); 
            if (isNaN(offset)) {
                throw new Error("Invalid $skip parameter");
            }
        } else {
            offset = 0;
        }
    } else {
        limit = 1000; // Default limit
        offset = 0; // Default offset
    }

    var collection_customers = await db.collection("customer");

    results = await collection_customers
        .find(filter)
        .skip(offset)
        .limit(limit)
        .toArray();

    results = results.slice(offset)

    for(var i=0; i< results.length; i++){
        results[i].id = results[i]._id.toString();
    }

    return results;
}


//Getting the number of customers per company name
async function _getCustomerByCustomerName(){
    await client.connect();

    var db = await client.db(db_name)
    var customer = await db.collection("customer")

    const results = await customer.aggregate([{$match: {type: "B" }},
                    {$group: {_id: "$customerName", count:{$sum: 1}}},
                    {$sort: {count: -1}}])
    return results.toArray();
}


async function _updateCustomer(req){
    await client.connect();

    var db = await client.db(db_name)
    var sapUsers = await db.collection("customer")

    var data = req.data;
    var sId = new ObjectId(data.id)
    delete data.id;

    const results = await sapUsers.updateOne({_id:sId}, {$set:data})

    if(results.modifiedCount === 1){
        delete data._id;
        data.id = sId;
        return data;
    } else {
        console.log(results.result)
        return results.result
    }
     
}

async function _deleteCustomer(req){

    await client.connect();

    var db = await client.db(db_name)
    var sapUsers = await db.collection("customer")

    var data = req.data
    var sId = new ObjectId(data.id)
    var results = await sapUsers.deleteOne({_id: sId})
    return results;
     
}

module.exports = cds.service.impl(function(){
    const {customer} = this.entities;
    this.on("INSERT", customer, _createCustomer)
    this.on("READ", customer, _getAllCustomers) // get all customers
    this.on("UPDATE", customer, _updateCustomer)
    this.on("getCustomerByCustomerName", _getCustomerByCustomerName) //Getting the number of customers per company 
    this.on("DELETE", customer, _deleteCustomer)

})