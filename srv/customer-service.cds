using {andy_mongo} from '../db/data-model';

service CustomerService @(path:'/CustomerService'){
    entity   customer as projection on andy_mongo.customer


    action getCustomerByCustomerName() returns array of {_id: String; count: Integer64}
}