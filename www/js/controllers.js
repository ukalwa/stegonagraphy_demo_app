angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    //console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller("ImgCaptureCtrl", function($scope, $cordovaCamera,imgService) {

  $scope.takePhoto = function () {
    var options = {
      quality: 70,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 300,
      targetHeight: 300,
      popoverOptions: CameraPopoverOptions,
      correctOrientation: true,
      saveToPhotoAlbum: true,
      allowEdit: true
    };

    $cordovaCamera.getPicture(options).then(function (imageData) {
      $scope.imgURI = "data:image/png;base64," + imageData;
      var pic = new Image();
      pic.src = $scope.imgURI;
      //console.log($scope.imgURI);
      pic.onload = function(){
        imgService.updateHeight(pic.height);
        imgService.updateWidth(pic.width);
        console.log(pic.height,pic.width);
      };
      imgService.updateURI($scope.imgURI);
    }, function (err) {
      // An error occured. Show a message to the user
    });
  };

  $scope.choosePhoto = function () {
    var options = {
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 300,
      targetHeight: 300,
      popoverOptions: CameraPopoverOptions,
      correctOrientation: true,
      saveToPhotoAlbum: false,
      allowEdit: true
    };


    $cordovaCamera.getPicture(options).then(function (imageData) {
      $scope.imgURI = "data:image/png;base64," + imageData;
      var pic = new Image();
      pic.src = $scope.imgURI;
      pic.onload = function(){
        imgService.updateHeight(pic.height);
        imgService.updateWidth(pic.width);
        console.log(pic.height,pic.width);
      };
      imgService.updateURI($scope.imgURI);
    }, function (err) {
      // An error occured. Show a message to the user
    });

  }

})

.controller('EmbedCtrl', function($scope,$cordovaCamera,$ionicPopup,$timeout,imgService,CipherService) {
  $scope.data={};
  $scope.data.bit_message = "";
  $scope.data.bit_message_length = "";
  $scope.data.embed_message = "";
  $scope.data.imageFileName ="";

  $scope.$watch('data.message',function(newValue,oldValue){
    if(oldValue === newValue)
      return;
    $scope.data.temp = $scope.data.message;
  });

  $scope.getPwd = function(){
    //Get a pass phrase or password from the user to encrypt with the password
    var myPopup = $ionicPopup.show({
        template: '<input type="password" ng-model="data.password">',
        title: 'Enter Pass phrase',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.password) {
                //don't allow the user to close unless he enters pass phrase
                e.preventDefault();
              } else {
                return $scope.data.password;
              }
            }
          }
        ]
      })
      .then(function(res) {
        console.log("Entered", res);
        $scope.embedMsg();
      }, function(error){
      console.log('error', error);
    }, function(myPopup){
        myPopup.close();
    });

    $timeout(function() {
      myPopup.close(); //close the popup after 3 seconds for some reason
    }, 3000);


  };

  $scope.embedMsg = function(){

    //Encrypt the message after the password is entered
    var encryptedData = CipherService.encrypt($scope.data.message,$scope.data.password);

    //Store the initialization vector, salt and cipher text in the local database
    window.localStorage.setItem("encrypted_data",JSON.stringify(encryptedData));
    var data = window.localStorage.getItem('encrypted_data');
    var test = JSON.parse(data);
    console.log(test.password);
    //Convert the cipher text to bit values by looping through all the characters
    var output = "";
    var temp="";
    for (var i=0; i < encryptedData.cipher_text.length; i++) {
      temp = ("00" + encryptedData.cipher_text[i].charCodeAt(0).toString(2)).slice(-8);
      output += temp;
    }
    $scope.data.bit_message = output.toString();
    $scope.data.embed_message = ("00000000"+$scope.data.bit_message.length.toString(2)).slice(-10)+$scope.data.bit_message;
    $scope.data.embed_message_length = $scope.data.embed_message.length;

    // Image processing process starts from here
    var canvas = document.getElementById('canvas');
    var imageObj = new Image();
    imageObj.src = imgService.getURI();
	  $scope.imgURI = imgService.getURI();
    //imageObj.src = 'img/darth-vader.jpg';
    canvasWidth  = imgService.getWidth();
    canvasHeight = imgService.getHeight();
    ctx = canvas.getContext('2d');
    imageObj.onload = function() {

      ctx.drawImage(imageObj, 0, 0,canvasWidth,canvasHeight);
      var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      var i = 0 , pix = 0,j=0;
      console.log($scope.data.embed_message_length,i,$scope.data.embed_message);
      var bit;
      while (j < $scope.data.embed_message_length) {
        if ((i % 4) + 1 !== 4) {
          pix = imageData.data[i];
          data = $scope.data.embed_message[j];
          bit = ("0000000" + pix.toString(2)).slice(-8);
          //console.log("pix value ",pix,i,j," LSB values ",bit,bit[7], data);

          if (bit[7] === data) {
          } else {
            bit = bit.substr(0, 7) + data.toString();
            pix = parseInt(bit, 2).toString();
          }
          imageData.data[i] = pix;

          j++;
        }
        i++;

      }

      ctx.putImageData(imageData, 0, 0);
      var canvas = document.getElementById("canvas");
      console.log("Canvas size : ", canvas.height, canvas.width);

      window.canvas2ImagePlugin.saveImageDataToLibrary(
        function(msg){
          $scope.data.imageFileName = msg.toString();
          console.log("Imaged saved to URI : "+msg);
        },
        function(err){
          console.log(err);
        },
        canvas
      );

    };
  }

})

.controller('DecodeCtrl', function($scope,$cordovaCamera,$ionicPopup,CipherService) {

  $scope.canvasWidth  = "";
  $scope.canvasHeight = "";
  $scope.choosePhoto = function () {
    var options = {
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.PNG,
      popoverOptions: CameraPopoverOptions,
      correctOrientation: true,
      saveToPhotoAlbum: false
    };


    $cordovaCamera.getPicture(options).then(function (imageData) {
      $scope.imgURI = "data:image/png;base64," + imageData;
      //console.log($scope.imgURI);
      var pic = new Image();
      pic.src = $scope.imgURI;
      //console.log($scope.imgURI);
      pic.onload = function(){
        $scope.canvasHeight = pic.height;
        $scope.canvasWidth = pic.width;
        console.log(pic.height,pic.width);
      };
    }, function (err) {
      // An error occured. Show a message to the user
    });
  };

  $scope.decodeImg = function () {
    var canvas = document.getElementById('canvas');
    var msg = "", numInBin = "", msgInBin="";
    var imageObj = new Image();
    imageObj.src = $scope.imgURI;

    ctx = canvas.getContext('2d');

    imageObj.onload = function() {

      ctx.drawImage(imageObj, 0, 0);
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var i = 0, j=0, msgLength = 0, numLength=10; //Change this if you change msgLength in EmbedCtrl
      var pix;
      var bit;
      while (j < numLength) {
        if ((i % 4) + 1 !== 4) {
          pix = imageData.data[i];
          //console.log("pix value ",pix,i);
          bit = ("0000000" + pix.toString(2)).slice(-8);
          console.log("pix value ", pix, i, j, "values ", bit);
          numInBin += bit[7].toString();
          console.log("LSB values ", bit[7], numInBin);
          j++;
        }
        i++;
      }
      msgLength = parseInt(numInBin,2);

      console.log(numInBin, msgLength);
      k=0;
      if(msgLength<100*8){

      while(k<=msgLength){
        if((i%4)+1 !== 4) {
          pix = imageData.data[i];
          //console.log("pix value ",pix,i);
          bit = ("0000000" + pix.toString(2)).slice(-8);
          console.log("pix value ", pix, i,k, "values ", bit);
          msgInBin += bit[7].toString();
          if((k%8) + 1 === 8){
            msg += String.fromCharCode(parseInt(msgInBin,2));
            msgInBin="";
          }
          //console.log("pix value ",pix,i," LSB values ",bit,bit[7],msg);
          k++;
        }
        i++;
      }
        console.log("proceed to get item");
      var test = window.localStorage.getItem('encrypted_data');
        var data = JSON.parse(test);
        //console.log(msg);
        //console.log(forge.util.decode64(msg));
        if(data !== undefined){
          var decipheredText = CipherService.decrypt(msg,data.password,data.salt,data.iv);

          //alert("The message is : " + msg);
          var alertPopup = $ionicPopup.alert({
            title: 'Decoded Message',
            template: decipheredText
          });
        }
        else
          console.log('data not deifned');
      }
    };
  }
})

  .service('imgService', function() {
    return {
      imgURI: {},
      imgHeight: {},
      imgWidth: {},
      password: {},
      getHeight: function(){
        return this.imgHeight;
      },
      getWidth: function(){
        return this.imgWidth;
      },
      updateWidth: function(imgWidth){
        this.imgWidth = imgWidth;
      },
      updateHeight: function(imgHeight){
        this.imgHeight = imgHeight;
      },
      getURI: function() {
        return this.imgURI;
      },
      updateURI: function(imgURI) {
        this.imgURI = imgURI;
      },
      getpassword: function() {
        return this.password;
      },
      updatepassword: function(password) {
        this.password = password;
      }
    }
  })

  .service("CipherService", function() {

    /*
     * Encrypt a message with a passphrase or password
     *
     * @param    string message
     * @param    string password
     * @return   object
     */
    this.encrypt = function(message, password) {
      var salt = forge.random.getBytesSync(128);
      var key = forge.pkcs5.pbkdf2(password, salt, 4, 16);
      var iv = forge.random.getBytesSync(16);
      var cipher = forge.cipher.createCipher('AES-CBC', key);
      cipher.start({iv: iv});
      cipher.update(forge.util.createBuffer(message));
      cipher.finish();
      var cipherText = forge.util.encode64(cipher.output.getBytes());
      return {cipher_text: cipherText, salt: forge.util.encode64(salt), iv: forge.util.encode64(iv), password: password};
    };

    /*
     * Decrypt cipher text using a password or passphrase and a corresponding salt and iv
     *
     * @param    string (Base64) cipherText
     * @param    string password
     * @param    string (Base64) salt
     * @param    string (Base64) iv
     * @return   string
     */
    this.decrypt = function(cipherText, password, salt, iv) {
      var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 16);
      var decipher = forge.cipher.createDecipher('AES-CBC', key);
      decipher.start({iv: forge.util.decode64(iv)});
      decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
      decipher.finish();
      return decipher.output.toString();
    }

  });
