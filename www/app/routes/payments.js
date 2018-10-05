import Route from '@ember/routing/route';
import $ from 'jquery';
import Payment from "../models/payment";
import config from '../config/environment';

export default Route.extend({
  model: function() {
    let url = config.APP.ApiUrl + 'api/payments';
    return $.getJSON(url).then(function(data) {
      if (data.payments) {
        var payments = data.payments.reverse();
        data.payments = payments.map(function(p) {
          return Payment.create(p);
        });
      }
      return data;
    });
  },

  setupController: function(controller, model) {
    this._super(controller, model);
  }
});
