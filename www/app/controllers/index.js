import Controller from '@ember/controller';
import { inject } from '@ember/controller';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Controller.extend({
  applicationController: inject('application'),
  stats: computed.reads('applicationController'),
  config: computed.reads('applicationController.config'),
  settings: computed.reads('applicationController.model.settings'),

  currencies: computed('stats.model', {
    get() {
      return this.get('stats.model.currencies');
    }
  }),

  selectedCurrency: computed('stats.model', {
    get() {
      return this.get('stats.model.selectedCurrency');
    }
  }),

  selectedSymbol: computed('stats.model', {
    get() {
      var curr = this.get('stats.model.selectedCurrency', 'USD');
      return this.get('currencies')[curr];
    }
  }),

  coinPrice: computed('stats.model', {
    get() {
      var price = this.get('stats.model.priceInfo');
      if (price === null) {
        return '--';
      }
      var curr = this.getWithDefault('stats.model.selectedCurrency', 'USD');
      var selected = price[curr];
      var symbol = this.get('currencies')[curr];
      return parseFloat(selected).toFixed(3);
    }
  }),

  btcPrice: computed('stats.model', {
    get() {
      var price = this.get('stats.model.priceInfo');
      if (price === null) {
        return '--';
      }
      var btc = price['BTC'];
      return parseFloat(btc).toFixed(8);
    }
  }),
  LastBlockFound: computed('stats', {
    get() {
      return this.getWithDefault('stats.model.stats.lastBlockFound');
    }
  }),

  // try to read some settings from the model.settings
  PayoutThreshold: computed('settings', {
    get() {
      var threshold = this.get('settings.PayoutThreshold');
      if (threshold) {
        // in shannon (10**9)
        return threshold / 1000000000;
      }
      return this.get('config').PayoutThreshold;
    }
  }),

  PayoutInterval: computed('settings', {
    get() {
      var interval = this.get('settings.PayoutInterval');
      if (interval) {
        return interval;
      }
      return this.get('config').PayoutInterval;
    }
  }),

  PoolFee: computed('settings', {
    get() {
      var poolfee = this.get('settings.PoolFee');
      if (poolfee) {
        return poolfee + '%';
      }
      return this.get('config').PoolFee;
    }
  }),

  cachedLogin: computed('login', {
    get() {
      return this.get('login') || $.cookie('login');
    },
    set(key, value) {
      $.cookie('login', value);
      this.set('model.login', value);
      return value;
    }
  }),
  chartOptions: computed("model.hashrate", {
        get() {
            var now = new Date();
            var e = this,
                t = e.getWithDefault("stats.model.poolCharts"),
                a = {
                    chart: {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        type: "spline",
                        height: 300,
                        marginRight: 10,
                        events: {
                            load: function() {
                                var self = this;
                                var chartInterval = setInterval(function() {
                                    if (!self.series) {
                                        clearInterval(chartInterval);
                                        return;
                                    }
                                    var series = self.series[0];
                                    var now = new Date();

                                    var shift = false;
                                    // partially update chart
                                    if (now - series.data[0].x > 18*60*60*1000) {
                                        // show 18 hours ~ 15(min) * 74(points) ~ poolChartsNum: 74, poolChars: "0 */15 ..."
                                        shift = true;
                                    }
                                    // check latest added temporary point and remove tempory added point for less than 5 minutes
                                    if (series.data.length > 1 && series.data[series.data.length - 1].x - series.data[series.data.length - 2].x < 5*60*1000) {
                                        series.removePoint(series.data.length - 1, false, false);
                                    }
                                    var x = now, y = e.getWithDefault("model.hashrate");
                                    var d = x.toLocaleString();
                                    series.addPoint({x: x, y: y, d:d}, true, shift);
                                }, e.get('config.highcharts.main.interval') || 60000);
                            }
                        }
                    },
                    title: {
                        text: "Our pool's hashrate"
                    },
                    xAxis: {
                        labels: {
                            style: {
                                color: "#000"
                            }
                        },
                        ordinal: false,
                        type: "datetime"
                    },
                    yAxis: {
                        title: {
                            text: "Pool Hashrate",
                            style: {
                                color: "#000"
                            }
                        },
                        min: 0,
                        labels: {
                            style: {
                                color: "#000"
                            }
                        }
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: "#000"
                    }],
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        formatter: function() {
                            return this.y > 1000000000000 ? "<b>" + this.point.d + "<b><br>Hashrate&nbsp;" + (this.y / 1000000000000).toFixed(2) + "&nbsp;TH/s</b>" : this.y > 1000000000 ? "<b>" + this.point.d + "<b><br>Hashrate&nbsp;" + (this.y / 1000000000).toFixed(2) + "&nbsp;GH/s</b>" : this.y > 1000000 ? "<b>" + this.point.d + "<b><br>Hashrate&nbsp;" + (this.y / 1000000).toFixed(2) + "&nbsp;MH/s</b>" : "<b>" + this.point.d + "<b><br>Hashrate<b>&nbsp;" + this.y.toFixed(2) + "&nbsp;H/s</b>";
                        },
                        useHTML: true
                    },
                    exporting: {
                        enabled: false
                    },
                    series: [{
                        color: "#15BD27",
                        name: "Hashrate",
                        data: function() {
                            var a = [];
                            if (null != t) {
                                t.forEach(function(d) {
                                    var x = new Date(1000 * d.x);
                                    var l = x.toLocaleString();
                                    var y = d.y;
                                    a.push({x: x, y: y, d: l});
                                });
                            }
                            var l = now.toLocaleString();
                            var y = e.getWithDefault("model.hashrate");
                            var last = {x: now, y: y, d: l};
                            var interval = e.get('config.highcharts.main.interval') || 60000;
                            if (a.length > 0 && now - a[a.length - 1].x > interval) {
                                a.push(last);
                            }
                            return a;
                        }()
                    }]
                };
            a.title.text = this.get('config.highcharts.main.title') || "";
            a.yAxis.title.text = this.get('config.highcharts.main.ytitle') || "Pool Hashrate";
            a.chart.height = this.get('config.highcharts.main.height') || 300;
            a.chart.type = this.get('config.highcharts.main.type') || 'spline';
            a.series[0].color = this.get('config.highcharts.main.color') || '#15b7bd';
            return a;
        }
    })
});
