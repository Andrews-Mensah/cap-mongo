using {cuid, managed, temporal, Currency} from '@sap/cds/common';
namespace  andy_mongo;

entity customer: managed{
    key id: String(256);
    name: String(256);
    type: String(2);
    emailId: String(200); 
    contactNo: String(32);
    address: String(256);
    customerName: String(150)
}

