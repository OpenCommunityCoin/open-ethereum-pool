import Controller from '@ember/controller';
import { inject } from '@ember/controller';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Controller.extend({
  applicationController: inject('application'),
  config: computed.reads('applicationController.config'),
  settings: computed.reads('applicationController.model.settings'),

  BlockUnlockDepth: computed('settings', {
    get() {
      var depth = this.get('settings.BlockUnlockDepth');
      if (depth) {
        return depth;
      }
      return this.get('config').BlockUnlockDepth;
    }
  }),

  chartOptions: computed("model.luckCharts", {
        get() {
            var e = this,
                t = e.getWithDefault("model.luckCharts"),
                a = {
                    colors: ['#f45b5b', '#8085e9', '#8d4654', '#7798BF', '#aaeeee',
                            '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
                    chart: {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        marginRight: 10,
                        height: 200,
                        events: {
                            load: function() {
                                var series = this.series[0];
                                setInterval(function() {
                                    var x = (new Date()).getTime(),
                                        y = e.getWithDefault("model.luckCharts.difficulty");
                                    series.addPoint([x, y], true, true);
                                }, 1090000000);
                            }
                        }
                    },
                    title: {
                        text: ""
                    },
                    xAxis: {
                        labels: {
                            style: {
                                color: '#6e6e70'
                            }
                        },
                        ordinal: false,
                        type: "datetime",
                        dateTimeLabelFormats: {
                            millisecond: "%H:%M:%S",
                            second: "%H:%M:%S",
                            minute: "%H:%M",
                            hour: "%H:%M",
                            day: "%m/%d",
                            week: "%m/%d",
                            month: "%b '%y",
                            year: "%Y"
                        }
                    },
                    yAxis: [{
                        labels: {
                            style: {
                                color: '#6e6e70'
                            },
                            formatter: function() {
                                var f = this.value;
                                var units = ['H', 'KH', 'MH', 'GH', 'TH'];
                                for (var i = 0; i < 5 && f > 1000; i++)  {
                                    f /= 1000;
                                }
                                return f.toFixed(2) + ' ' + units[i];
                            }
                        },
                        title: {
                            text: "Difficulty",
                            style: {
                                color: 'black',
                                fontSize: '13px',
                                fontWeight: 'normal'
                            }
                        },
                        softMax: 100,
                        gridLineColor: "#e6e6e6"
                    }, {
                        labels: {
                            style: {
                                color: '#6e6e70'
                            },
                            formatter: function() {
                                return this.value.toFixed(0) + ' %';
                            }
                        },
                        title: {
                            text: "Luck",
                            style: {
                                color: 'black',
                                fontSize: '13px',
                                fontWeight: 'normal'
                            }
                        },
                        opposite: true,
                        softMax: 100,
                        gridLineColor: "#e6e6e6",

                        plotLines: [{
                            value: 100,
                            width: 2,
                            color: "#4398de",
                            label: {
                            text: 'expected: 100 %',
                            align: 'center',
                            style: {
                              color: 'gray'
                            }
                          }
                       }]
                    }],
                    plotOptions: {
                        series: {
                            shadow: true
                        },
                        candlestick: {
                            lineColor: '#404048'
                        },
                        map: {
                            shadow: false
                        }
                    },
                    legend: {
                        enabled: true,
                        itemStyle: {}
                    },
                    tooltip: {
                        formatter: function() {
                            function scale(v) {
                                var f = v;
                                var units = ['H', 'KH', 'MH', 'GH', 'TH'];
                                for (var i = 0; i < 5 && f > 1000; i++)  {
                                    f /= 1000;
                                }
                                return f.toFixed(2) + ' ' + units[i];
                            }

                            var d = scale(this.point.f);
                            var s = scale(this.point.s);

                            return "<div>" +
                              "<b>Difficulty: " + d + "</b><br/>" +
                              "<b>Shares: " + s + "</b><br/>" +
                              "<b>Luck: " + (this.point.s*100).toFixed(2)+ " %</b><br/>" +
                              (this.point.w > 0 ? "<b>Reward:&nbsp;" + (this.point.w/1000000000000000000).toFixed(6) + ' ' + e.get('config.Unit') + "</b><br/>" : '') +
                              "<b>Block Height: #" + this.point.h + "</b><br/>" +
                              "<b>" + this.point.d + "</b><br/>" +
                              "</div>";
                        },

                        useHTML: true
                    },
                    exporting: {
                        enabled: true
                    },
                    series: [{
                        yAxis: 0,
                        step: 'center',
                        color: "#E99002",
                        name: "difficulty",
                        data: function() {
                            var a = [];
                            if (null != t) {
                                t.forEach(function(i) {
                                    var n = 0, r = 0, l = 0;
                                    r = new Date(1e3 * i.x);
                                    l = r.toLocaleString();
                                    n = i.difficulty;
                                    a.push({
                                        x: r, d: l, y: n,
                                        h: i.height, w: i.reward, s: i.sharesDiff, f: i.difficulty
                                    });
                                });
                            } else {
                                a.push({ x: 0, d: 0, y: 0, h: 0, w: 0, s: 0, f: 0 });
                            }
                            return a;
                        }()
                    }, {
                        yAxis: 1,
                        step: 'center',
                        color: "#3db72f",
                        name: "Luck",
                        data: function() {
                            var a = [];
                            if (null != t) {
                                t.forEach(function(i) {
                                    var n = 0, r = 0, l = 0;
                                    r = new Date(1e3 * i.x);
                                    l = r.toLocaleString();
                                    n = i.sharesDiff * 100;
                                    a.push({
                                        x: r, d: l, y: n,
                                        h: i.height, w: i.reward, s: i.sharesDiff, f: i.difficulty
                                    });
                                });
                            } else {
                                a.push({ x: 0, d: 0, y: 0, h: 0, w: 0, s: 0, f: 0 });
                            }
                            return a;
                        }()
                    }]
                };
            a.title.text = this.getWithDefault('config.highcharts.blocks.title', '');
            a.chart.height = this.getWithDefault('config.highcharts.blocks.height', 200);

            a.chart.backgroundColor = this.getWithDefault('config.highcharts.blocks.backgroundColor', "transparent");
            a.xAxis.lineColor = this.getWithDefault('config.highcharts.blocks.lineColor', "#ccd6eb");
            a.yAxis.lineColor = this.getWithDefault('config.highcharts.blocks.lineColor', "#ccd6eb");
            a.xAxis.tickColor = this.getWithDefault('config.highcharts.blocks.tickColor', "#ccd6eb");
            a.yAxis.tickColor = this.getWithDefault('config.highcharts.blocks.tickColor', "#ccd6eb");
            a.xAxis.gridLineColor = this.getWithDefault('config.highcharts.blocks.gridLineColor', "#ccd6eb");
            a.xAxis.gridLineWidth = this.getWithDefault('config.highcharts.blocks.gridLineWidthX', "0");
            a.yAxis[0].gridLineColor = this.getWithDefault('config.highcharts.blocks.gridLineColor', "#ccd6eb");
            a.yAxis[1].gridLineColor = this.getWithDefault('config.highcharts.blocks.gridLineColor', "#ccd6eb");
            a.yAxis[0].title.style.color = this.getWithDefault('config.highcharts.blocks.labelColor', 'black');
            a.yAxis[1].title.style.color = this.getWithDefault('config.highcharts.blocks.labelColor', 'black');
            a.yAxis[1].plotLines[0].color = this.getWithDefault('config.highcharts.blocks.plotLineColor', '#4398de');
            a.legend.itemStyle.color = this.getWithDefault('config.highcharts.blocks.labelColor', "#fff");
            return a;
        }
    })

});
