'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'open-ethereum-pool',
    environment: environment,
    rootURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // PoolName
      PoolName: 'Ethereum',
      // PoolTitle
      PoolTitle: 'Open Ethereum Pool',
      // API host and port
      ApiUrl: '//example.net/',

      // HTTP mining endpoint
      HttpHost: 'http://example.net',
      HttpPort: 8888,

      // Stratum mining endpoint
      StratumHost: 'example.net',
      StratumPort: 8008,

      // Fee and payout details
      PoolFee: '1%',
      PayoutThreshold: '1',
      PayoutInterval: '2m',
      Unit: 'ETH',
      EtherUnit: 'ETH',

      // For network hashrate (change for your favourite fork)
      BlockExplorerLink: 'https://myexplorer.net',
      BlockExplorerAddrLink: 'https://myexplorer.net/addr',
      DonationLink: false,
      DonationAddress: '',
      BlockReward: 5,
      BlockUnlockDepth: 120,
      BlockTime: 14.4,
      highcharts: {
        main: {
          enabled: true,
          height: 200,
          type: 'spline',
          color: '',
          labelColor: '#909090',
          lineColor: '#404850',
          tickColor: '#404850',
          gridLineColor: '#404850',
          gridLineWidthX: 1,
          gridLineWidthY: 1,
          backgroundColor: 'transparent',
          title: '',
          ytitle: '',
          interval: 180000,
          chartInterval: 900000
        },
        account: {
          enabled: true,
          main: false,
          height: 200,
          type: 'spline',
          color: [ '', '' ],
          labelColor: '#909090',
          lineColor: '#404850',
          tickColor: '#404850',
          gridLineColor: '#404850',
          gridLineWidthX: 1,
          gridLineWidthY: 1,
          backgroundColor: 'transparent',
          title: '',
          ytitle: '',
          interval: 180000,
          chartInterval: 900000,
          paymentInterval: 300000
        },
        blocks: {
          enabled: true,
          height: 200,
          shareColor: '',
          diffColor: '',
          labelColor: '#909090',
          lineColor: '#404850',
          tickColor: '#404850',
          gridLineColor: '#404850',
          gridLineWidthX: 1,
          gridLineWidthY: 1,
          backgroundColor: 'transparent',
          title: '',
          ytitle: '',
          interval: 180000,
          chartInterval: 900000
        }
      },
      currencies: { CNY: '¥', JPY: '¥', KRW: '₩', USD: '$', EUR: '€' },
      defaultCurrencies: {
        en: 'USD',
        ja: 'JPY',
        ko: 'KRW',
        de: 'EUR',
        fr: 'EUR',
        zh: 'CNY'
      },
      priceShowBtc: false,
      priceShowAll: true,
      newStyle: true,
      oldStyle: false,
      newMain: true,
      legacyMain: false,
      //priceApiType: 'cryptocompare',
      //priceApiUrl: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,CNY,USD,KRW,EUR,JPY',
      priceApiType: 'coinmarketcap',
      priceApiUrl: 'https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=KRW',
      ratioApiUrl: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=CNY,USD,KRW,EUR,JPY'
    }
  };

  if (environment === 'development') {
    /* Override ApiUrl just for development, while you are customizing
      frontend markup and css theme on your workstation.
    */
    ENV.APP.ApiUrl = 'http://localhost:8081/'
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
