// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova','starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.imgCapture', {
    url: '/imgCapture',
    views: {
      'menuContent': {
        templateUrl: 'templates/imgCapture.html',
        controller: 'ImgCaptureCtrl'
      }
    }
  })

  .state('app.embed', {
      url: '/embed',
      views: {
        'menuContent': {
          templateUrl: 'templates/embed.html',
          controller: 'EmbedCtrl'
        }
      }
    })

  .state('app.decode', {
    url: '/decode',
    views: {
      'menuContent': {
        templateUrl: 'templates/decode.html',
        controller: 'DecodeCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/imgCapture');
});
