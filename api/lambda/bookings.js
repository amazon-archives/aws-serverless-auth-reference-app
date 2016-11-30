'use strict';
let rfr = require('rfr');
let data = rfr('data');
let wrapper = rfr('wrapper');
let BookingsTable = new data.BookingsTable();


function Create(event) {
  let input = JSON.parse(event.body);
  return BookingsTable.put(input);
}

function Delete(event){
  return BookingsTable.delete(
    event.pathParameters.bookingId
  )
}

function Get(event) {
  return BookingsTable.get(event.pathParameters.resourceId);
}

function ListByResourceId(event) {
  return BookingsTable.queryBookingsByResourceId(event.pathParameters.resourceId);
}

function ListByUserId(event) {
  return BookingsTable.queryBookingsByUserId(event.pathParameters.userId);
}


module.exports = wrapper.wrapModule({
  Create,
  Delete,
  Get,
  ListByResourceId,
  ListByUserId,
});
