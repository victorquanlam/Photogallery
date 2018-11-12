
var app = angular.module("photoGallery", ['ngRoute', 'ngFileUpload', 'firebase','ui.bootstrap']);


//config for router
app.config(['$routeProvider', function ($routeProvider) {
  //direct to main page
  $routeProvider.when('/',{
    templateUrl: 'main.html',
    controller: 'GalleryCtrl'
  })
    //direct to gallery
    .when('/gallery',{
    templateUrl:'gallery.html',
    controller: 'GalleryCtrl'
  })
    //direct to sign up page
    .when("/sign-up", {
    templateUrl:'sign-in.html',
    controller:'AccountCtrl'
  })
  //direct to log in page
  .when("/log-in", {
    templateUrl:'log-in.html',
    controller:'AccountCtrl'
  })
  //direct to upload page to upload image
    .when("/upload", {
    templateUrl:'upload.html',
    controller:'MainCtrl'
  })
  //direct to following page with ID
  .when("/following/:userID", {
    templateUrl:'following.html',
    controller:'MainCtrl'
  })
  //direct to account page
    .when("/account", {
    templateUrl:'account.html',
    controller:'AccountCtrl'
  })
  //other wise it will go to main page
  .otherwise({
    redirectTo:'/'
  });

}])


  // Factory variable to store log-in account for all the page
  app.factory("Account", function() {
    var account={};
    var service={};
    account.userName ="";
    account.statusNow = false;
    //service function to get username and status or set their value
    service = {
        setUserName: function(stringName) {
          account.userName = stringName;
          account.statusNow = true;
        },
        getUserName: function() {
          return account.userName;
        },
        getStatus: function() {
          return account.statusNow;
        },
        newAccount: function(){
          account.newAccount= true;
        },
        logout: function(){
         account.status=false;
        account.userName=null;
        }

      };
    return service;
  });


//controller for main page
app.controller('MainCtrl',['$scope','$firebaseStorage','$firebaseArray','$rootScope','$routeParams',function($scope,$firebaseStorage,$firebaseArray,$rootScope,$routeParams){
  var uploadbar= document.getElementById("uploadbar");
  //autofill date
  var date = new Date();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  $scope.today = day + "-" + month + "-" + year;


  //passing the ID to scope variable from routeParams
  $scope.userID=$routeParams.userID;


  $scope.tags={};
  $scope.displayMsg = true;
  $scope.msg ="No File selected. Please select a file to upload";

//select file function
    $scope.selectFile = function(file){
      $scope.fileList = file;
      $scope.displayMsg =false;
    };
      //Remove file from fileList
      $scope.removeFile = function(file){
        var index= $scope.fileList.indexOf(file);
        $scope.fileList.splice(index,1);
        if($scope.fileList.length < 1){
          $scope.displayMsg =true;
        }
      };
//upload file function
    $scope.uploadFile = function(file){
      var file = file;

      var caption = $scope.tags.caption;

      var tags = $scope.tags.tag;

      var key = $scope.tags.key;

      var date = $scope.tags.date.getDate() +"-"+$scope.tags.date.getMonth()+"-"+$scope.tags.date.getFullYear();
    //if those value are undefine they will be set as null in the data base
      if(tags == undefined)
        {
          tags="null";
        };
      if(caption == undefined)
        {
          caption="null";
        };
      if(key == undefined)
        {
          key="null";
        };
      if(date == undefined)
        {
          date=$scope.today;
        };
      var storageRef = firebase.storage().ref('Photos/' + file.name);
      var storage = $firebaseStorage(storageRef);
        //upload image to the storage cloud
      var uploadTask = storage.$put(file);
        //progress bar
      uploadTask.$progress(function(snapshot){
        var percentageUpload = (snapshot.bytesTransferred/snapshot.totalBytes)* 100;
        $scope.percentage = percentageUpload.toFixed(0);
        uploadbar.style.width =$scope.percentage +'%';
        var ref = firebase.database().ref("Images");
        var urls = $firebaseArray(ref);
        //if the progress bar become 100% it will pass image information to the database
        if(percentageUpload==100){
          storageRef.getDownloadURL().then(function(url){
            var testData={
              "imageName" :snapshot.metadata.name,
              "imageURL":url,
              "imageKey" : key,
              "imageCaption" : caption,
              "imageTags": tags,
              "imageDate" : date,
              "user" : $rootScope.username,
              "votes" :0

            };
            urls.$add(testData).then((snap)=>{console.log("pushed to firebase");
                                                    });

          });

        };
      });

      //Upload Complete
      uploadTask.$complete(function(snapshot){


        //Error while uploading
        uploadTask.$error(function(error){
          console.log(error);
        });

         //remove fileList when uploading complete
        $scope.removeFile(file);
        $scope.msg = "Photo uploaded Succesfully. Select another."
      });


    };





}])

//controller for gallery and main page to display images
app.controller('GalleryCtrl',['$scope','$firebaseStorage','$firebaseArray','$routeParams','$rootScope','$filter',function($scope,$firebaseStorage,$firebaseArray, $routeParams,$rootScope,$filter){
  //get the  data for images from database
  var ref = firebase.database().ref("Images");
  var urls = $firebaseArray(ref);
  $scope.urls = urls;
  $scope.newData={};
  $scope.username=$rootScope.username;
  $scope.loginStatus=$rootScope.status;
  $scope.option='0';
  var date = new Date();
  $scope.deleteFile = function(url){
    //get storage reference
    var storageRef = firebase.storage().ref('Photos/'+url.imageName);
    var storage= $firebaseStorage(storageRef);

    //delete File
    storage.$delete().then(function(){
      $scope.urls.$remove(url); //remove data from the database
    }).catch(function(error){
      console.log(error.message);
    });
  };


  //update file information
  $scope.updateFile = function(urlChosen) {
    console.log("Let's upload a file!");


    //update to the url if they are not null
    if($scope.newData.updateCaption!=undefined){
      urlChosen.imageCaption = $scope.newData.updateCaption.toString();
    };
    if($scope.newData.updateTags!=undefined){
       urlChosen.imageTags = $scope.newData.updateTags.toString();
    };
    if($scope.newData.updateKey!=undefined){
      urlChosen.imageCaption = $scope.newData.updateKey.toString();
    };

    //change the form of date to date-month-year
    urlChosen.imageDate = $scope.newData.updateDate.getDate() +" - "+$scope.newData.updateDate.getMonth()+" - "+$scope.newData.updateDate.getFullYear();

    //save to the databse API
    $scope.urls.$save(urlChosen);


    };

  //storeId function
  $scope.storeID = function(urlChosen) {
    $scope.ID=urlChosen.imageURL;

    };
   $scope.searchVar = {};
//remove search function
    $scope.removeSearch = function(){
      $scope.searchTags=null;
      $scope.searchKey=null;
      $scope.searchCaption=null;
      $scope.search=null;
      $scope.searchVar = {};
      $scope.hideinfo=true;
    }

  $scope.typeAhead = {};
//search button function + type ahead function
  $scope.searchButton = function(){
    //if search is not null then apply the value of searchVar to the value of the value on text box
    if($scope.searchTags!=null){
      $scope.searchVar.imageTags = $scope.searchTags;
      $scope.hideinfo=true;
    }
    else if($scope.searchKey!=null){
      $scope.searchVar.imageKey = $scope.searchKey;
      $scope.hideinfo=true;

    }
    else if($scope.searchCaption!=null){
      $scope.searchVar.imageCaption = $scope.searchCaption;


    }
    else if($scope.search!=null){
      $scope.searchVar = $scope.search;
      $scope.hideinfo=true;

    }

  };

  //search matching function
  $scope.hideinfo = true;
  $scope.total = function(string) {
        $scope.hideinfo = false;
    //create an empty array to store value of sorted urls
        var output = [];
        angular.forEach($scope.urls, function(url) {
          //start the loop if string is not empty
          if(string!=""){
            //if the searchVar match with Caption then push those image to output array
            if (url.imageCaption.toLowerCase().indexOf(string.toLowerCase()) >= 0 &&($scope.option=='0'||$scope.option=='3')) {
                output.push("Caption: " +url.imageCaption);

            }

            //same as caption
            else if (url.imageKey.toLowerCase().indexOf(string.toLowerCase()) >= 0 &&($scope.option=='0'||$scope.option=='2')) {
                output.push("Key: "+url.imageKey);

            }
            //same as caption
            else if (url.imageName.toLowerCase().indexOf(string.toLowerCase()) >= 0 && $scope.option=='0') {
                output.push("Name: "+url.imageName);
            }
            //same as caption
            else if (url.imageTags.toLowerCase().indexOf(string.toLowerCase()) >= 0 &&($scope.option=='0'||$scope.option=='1')) {
                  output.push("Tags: "+url.imageTags);
              };
          };
        });
    //assign search_ouptput to output array
        $scope.search_output = output;
    };

  //function to choose the categotaires
    $scope.choose_textbox = function(string) {
        switch($scope.option){
          case '0':
            $scope.search = string;
            break;
          case '1':
            $scope.searchTags = string;
            break;
          case '2':
            $scope.searchKey = string;
            break;
          case '3':
            $scope.searchCaption = string;
            break;

        }

        $scope.hideinfo = true;
    };


//load more button function setting up

    $scope.imagesPerPage = 8;
    $scope.currentPage = 0;
    $scope.totalImages = 0;
    $scope.outputImages = [];
    var totalPages =0;
    var outputImages=[];
  //load initial when urls which is images from database
    urls.$loaded().then(function(data){
    angular.forEach(data, function(url) {
      $scope.totalImages++;
      //if the page is the gallery of Id of user the gallery will get all the image has username match with user name of the image
      if($scope.pageOption=="following"){
        if(url.user==$routeParams.userID){
          outputImages.unshift(url);
        }
      }
      //if the page is the gallery of user the gallery will get all the image has username match with user name of the image
      else if($scope.pageOption=="owner"){
        if(url.user==$scope.username){
          outputImages.unshift(url);
        }
      }
      //if not the gallery then the all the images will be display
        else {
          outputImages.unshift(url);
        };

      //add the array the next set of images
      $scope.outputImages = outputImages.slice($scope.currentPage*$scope.imagesPerPage,$scope.currentPage*$scope.imagesPerPage + $scope.imagesPerPage);
    });
    });


//load more page function
    $scope.loadMore = function() {

        $scope.currentPage++;
        //add the array the next set of images
          var newImages = outputImages.slice($scope.currentPage*$scope.imagesPerPage,$scope.currentPage*$scope.imagesPerPage + $scope.imagesPerPage);
          $scope.outputImages = $scope.outputImages.concat(newImages);


        };


//disable the button if it is the last page
    $scope.nextPageDisabledClass = function() {
      return $scope.currentPage === $scope.pageCount()-1 ? "disabled" : "";
    };
    $scope.pageCount = function() {
        return Math.ceil($scope.totalImages/$scope.imagesPerPage);
    };



  //like button function
  $scope.ply = {};
  //single user allow to give one like only
    $scope.ply.userVotes = {
      aaa:1
    };
  $scope.doVote = function(url){
    var currUser = $rootScope.username;

    if ($scope.ply.userVotes[currUser] == 1) {
      delete $scope.ply.userVotes[currUser];
      url.votes--;
      $scope.urls.$save(url);
    }
    else {
      $scope.ply.userVotes[currUser] = 1;
      url.votes++;
      $scope.urls.$save(url);
    }

  };

  //delete votes function
  $scope.deleteItem = function(){
    if ($scope.selectedItem >= 0) {
      $scope.data.splice($scope.selectedItem,1);
    }
  };


  //add comment function
  $scope.postComment= function(url,comment){
    //if comment if empty then print error message
    if(comment==undefined){
      $scope.message="Please enter your comment";
    }
    else{
      //if the comment is not empty then add the comment
      $scope.myComment=comment;
      $scope.myMessage=$rootScope.username+": "+comment;

      //create empty array to store the commen
      var output=[];
      angular.forEach(url.comments, function(element) {
        //push old comments to the array
        output.push(element);
      });
        //push the new comment the array
      output.push($scope.myMessage);
        //replace the comments to the new output array which store the new comments
       url.comments=output;

      //sa
      $scope.urls.$save(url);
    };

  };





  var ref1 = firebase.database().ref("Accounts");
  var accounts= $firebaseArray(ref1);
  $scope.accounts =accounts;


  //check if this user has followed this page or not
  $scope.checkFollow =function(){
      angular.forEach(accounts, function(id) {
        if(id.userName==$rootScope.username){
          angular.forEach(id.follow, function(following) {
            if(following==$scope.userID){
             $scope.check= true;
            }


          });


        };

      });
  }();
  //run this function to check whereter user has follow this person

//follow function that let the user follow other person
  $scope.follow =function(){
      $scope.check= true;
    //empty follow array
      var follow=[];
      angular.forEach(accounts, function(id) {
        if(id.userName==$rootScope.username){
          angular.forEach(id.follow, function(following) {
            //push to array empty
            follow.push(following);

          });
          //update new follow lists
          follow.push($scope.userID);
          id.follow=follow;
          $scope.accounts.$save(id);
        };

      });




  };

  //unfollow function that let the user unfollow other person
  $scope.unfollow =function(){
      $scope.check= false;
      var follow1=[];
      angular.forEach(accounts, function(id) {
        if(id.userName==$rootScope.username){
          angular.forEach(id.follow, function(following) {
            if(following!=$scope.userID){
              follow1.push(following);

            }

          });
          id.follow=follow1;
          $scope.accounts.$save(id);
        };

      });




  };


}])


//controller for login, signup and account htmls
app.controller('AccountCtrl',['$scope','$firebaseStorage','$firebaseArray','$routeParams','Account','$location','$rootScope','$timeout',function($scope,$firebaseStorage,$firebaseArray, $routeParams,Account,$location,$rootScope,$timeout){

  $scope.fixInf=false;
  $scope.user = [];
  $scope.update = [];

  $scope.myVar = false;
  $scope.toggle = function() {
    $scope.myVar = !$scope.myVar;
    };
  $scope.wasSubmitted = false;

      var address = $scope.user.address;
      var suburb = $scope.user.suburb;
      var postcode = $scope.user.postcode;
      var phone = $scope.user.phone;

      if(address == undefined)
        {
          address="null";
        };
      if(suburb == undefined)
        {
          suburb="null";
        };
      if(postcode == undefined)
        {
          postcode="null";
        };
      if(phone == undefined)
        {
          phone="null";
        };

  var ref = firebase.database().ref("Accounts");
  var ids = $firebaseArray(ref);
  $scope.ids =ids;



//submit function to upload all the infornmation to the database to create a new account
  $scope.submit = function() {
    $scope.wasSubmitted = true;
    var accountInfo={
      "firstName" :$scope.user.firstname,
      "secondName" :$scope.user.secondname,
      "userName" :$scope.user.username,
      "password" :$scope.user.pwd,
      "email" :$scope.user.email,
      "address" :address,
      "suburb" :suburb,
      "postcode" :postcode,
      "phonenumber" :phone,
      "follow":"null"


    };
    ids.$add(accountInfo).then((snap)=>{
      console.log("new account has created ");
      $scope.showModal = !$scope.showModal;
      $scope.msg="Your account has been successfully created. Log in by using your new account now" ;
      $timeout(function(){
                  $location.path("/log-in");
                  $scope.showModal = !$scope.showModal;
                },3000);
    });


    };

//update changes to the data base
  $scope.change = function() {
    $scope.wasSubmitted = true;
    //keepGoing is use as a while loop. It will break when the account's name is found
    var keepGoing=true;
    angular.forEach(ids, function(id) {
      if(keepGoing){
        //start the loop when username in array is matched with the username current
        if(id.userName==$rootScope.username ){

            if($scope.update.firstname!=undefined){
              id.firstName =$scope.update.firstname;
            };
            if($scope.update.secondname!=undefined){
              id.secondName =$scope.update.secondname;
            };
            if($scope.update.username!=undefined){
              id.userName =$scope.update.username;
              $rootScope.username=$scope.update.username;
            };
            if($scope.update.password!=undefined){
              id.password =$scope.update.password;
            };
            if($scope.update.email!=undefined){
              id.email =$scope.update.email;
            };
            if($scope.update.address!=undefined){
              id.address =$scope.update.address;
            };
            if($scope.update.suburb!=undefined){
              id.suburb =$scope.update.suburb;
            };
            if($scope.update.postcode!=undefined){
              id.postcode =$scope.update.postcode;
            };
            if($scope.update.phonenumber!=undefined){
              id.phonenumber =$scope.update.phonenumber;
            };
            $scope.ids.$save(id);
          //stop the while loop
            keepGoing=false;
          //pop up a message screen
            $scope.msg="Your account information has been successful updated";
             $scope.showModal = !$scope.showModal;
            $scope.fixInf=true;
    };
      };
      });



    };

   $scope.showModal = false;



//login function auto login your account
  $scope.login = function() {
        $scope.hideinfo = false;
        var output = [];

        var keepGoing=true;


    //search from all the id to get the id has match username
        angular.forEach($scope.ids, function(id) {
          if(keepGoing) {
            $scope.haha=id.userName;
            $scope.hahaa=id.password;
            //check for username and password
            if ($scope.username==id.userName && $scope.password==id.password){
              $scope.msg="Login successful. You are directing to home page" ;
              $scope.showModal = !$scope.showModal;
                $rootScope.username=$scope.username;
                $rootScope.status=true;
              //auto direct to another page after 3000ms
                $scope.onscreenMessage="";
                $timeout(function(){
                  $location.path("/main");
                  $scope.showModal = false;
                },3000);
              //store username to factory variable
                Account.setUserName($scope.username);
                var db = firebase.database();
                db.ref("Login").set({user: $scope.username});

                db.ref("Login").child('user').on("value", function(snapshot) {
                  console.log(snapshot.val());

              });


                console.log("Login successful." +  db.ref("Login").val + Account.getStatus());
                keepGoing=false;


            }
           else{
            //error messge when nothing is found
            $scope.onscreenMessage="Your user name or password is incorrect. Please try again.";
          };
        };
    });
  };


}])

//controller for navbar
app.controller('NavBarCtrl',['$scope','$firebaseStorage','$firebaseArray','$routeParams','Account','$location','$rootScope',function($scope,$firebaseStorage,$firebaseArray, $routeParams,Account,$location,$rootScope){
  //logout function to clear rootscope of username
  $scope.logout = function() {
        $rootScope.status=false;
        $rootScope.username="";
    };

}])

//modal directive pop up screen message
app.directive('modal', function () {
    return {
      //model template for all the message
      template: '<div class="modal fade ">' +
          '<div class="modal-dialog">' +

            '<div class="modal-content">' +
              '<div class="modal-header">' +
                '<h4 class="modal-title message-color">Message</h4>' +
              '</div>' +
              '<div class="modal-body message-dialog text-center" >{{msg}}</div>' +
            '</div>' +
          '</div>' +
        '</div>',
      restrict: 'E',
      transclude: true,
      replace:true,
      scope:true,
      //this to hide or show the model popup
      link: function postLink(scope, element, attrs) {
          scope.$watch(attrs.visible, function(value){
          if(value == true)
            $(element).modal('show');
          else
            $(element).modal('hide');
        });

        $(element).on('shown.bs.modal', function(){
          scope.$apply(function(){
            scope.$parent[attrs.visible] = true;
          });
        });

        $(element).on('hidden.bs.modal', function(){
          scope.$apply(function(){
            scope.$parent[attrs.visible] = false;
          });
        });
      }
    };
  });




