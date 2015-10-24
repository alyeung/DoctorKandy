$(function() {
  var callId;

  // Create audio objects to play incoming calls and outgoing calls sound
  var $audioRingIn = $('<audio>', {
    loop: 'loop',
    id: 'ring-in'
  });

  var $audioRingOut = $('<audio>', {
    loop: 'loop',
    id: 'ring-out'
  });

  // Load audio source to DOM to indicate call events
  var audioSource = {
    ringIn: [{
      src: 'https://kandy-portal.s3.amazonaws.com/public/sounds/ringin.mp3',
      type: 'audio/mp3'
    }, {
      src: 'https://kandy-portal.s3.amazonaws.com/public/sounds/ringin.ogg',
      type: 'audio/ogg'
    }],
    ringOut: [{
      src: 'https://kandy-portal.s3.amazonaws.com/public/sounds/ringout.mp3',
      type: 'audio/mp3'
    }, {
      src: 'https://kandy-portal.s3.amazonaws.com/public/sounds/ringout.ogg',
      type: 'audio/ogg'
    }]
  };

  audioSource.ringIn.forEach(function(entry) {
    var $source = $('<source>')
      .attr('src', entry.src);
    $audioRingIn.append($source);
  });

  audioSource.ringOut.forEach(function(entry) {
    var $source = $('<source>')
      .attr('src', entry.src);
    $audioRingOut.append($source);
  });

  /** setup(config) intializes kandy
    @param <object> config
  */
  kandy.setup({

    remoteVideoContainer: $('#incoming-video')[0],
    localVideoContainer: $('#outgoing-video')[0],

    // listeners registers events to handlers
    // You can handle all Kandy Events by registering it here
    listeners: {
      callincoming: onCallIncoming,
      oncall: onCall,
      callanswered: onCallAnswer,
      callended: onCallTerminate,
      callrejected: onCallRejected
    }
  });

  /** UIState is a custom piece of code that shuffles between UI states
      eg:: If user is authenticated, the relevant DOM elements are brought to screen
      and the rest are hidden. Using this method is NOT recommended!
  */

  var username, UIState = {};

  UIState.authenticated = function() {
    $('#login-form')
      .addClass('hidden');
    $('#logged-in')
      .removeClass('hidden');
    $('.username')
      .text(username);
  };

  UIState.unauthenticated = function() {
    $('#login-form')
      .removeClass('hidden');
    $('#logged-in')
      .addClass('hidden');
    $('.username')
      .text('');
  };

  UIState.initial = function() {
    console.log('initial');

    $audioRingIn[0].pause();
    $audioRingOut[0].pause();

    $('#call-form p, #incoming-call p, #call-connected p')
      .text('');
    $('#incoming-call, #call-connected, .call-terminator, #resume-call-btn')
      .addClass('hidden');
    $('#call-form, .call-initializer')
      .removeClass('hidden')
  };
  // Event handler for login form button
  var userArray = [];

  username = 'louis@lololol.gmail.com';
  var apiKey = 'DAKd8635e7c830d4a14afae0c829c505e80';
  var password = 'Password1234';

  /** login(domainApiId, userName, password,success,failure)
      logs in user to Kandy Platform
      @params <string> domainApiId, <string> userName, <string> password, <function> success/failure
  */
  kandy.login(apiKey, username, password, function(msg) {

      userArray.push(username);
      kandy.getLastSeen(userArray);

      UIState.authenticated();
    },
    function(msg) {
      UIState.unauthenticated();
      alert('Login Failed!');
    });

  // Event handler for logout button

  $('#logout-btn')
    .on('click', function(e) {
      e.preventDefault();
      /** logout(success) logs a user out of the Kandy Platform
          @param <function> success - Callback handler for
          successful logout
      */
      kandy.logout(function() {
        userArray.push(username);
        kandy.getLastSeen(userArray);
        UIState.unauthenticated();
      });
    });
  // Event handler for oncall event
  function onCall(call) {
    console.debug('oncall');
    $audioRingOut[0].pause();
    UIState.oncall();
  }

  // Event handler for callended event
  function onCallTerminate(call) {
    console.debug('callended');
    callId = null;

    $audioRingOut[0].play();
    $audioRingIn[0].pause();

    UIState.initial();
  }

  $('#hold-call-btn')
    .on('click', function() {
      kandy.call.holdCall(callId);
      UIState.holdcall();
    });

  $('#resume-call-btn')
    .on('click', function() {
      kandy.call.unHoldCall(callId);
      UIState.resumecall();
    });

  // Event handler for call end button
  $('#end-call-btn')
    .on('click', function() {
      kandy.call.endCall(callId);
      UIState.initial();
    });

  UIState.oncall = function() {
    console.log('oncall');

    $('#incoming-call, #call-form')
      .addClass('hidden');
    $('#call-connected')
      .removeClass('hidden');
  };

  UIState.holdcall = function() {
    console.log('holdcall');

    $('#hold-call-btn')
      .addClass('hidden');
    $('#resume-call-btn')
      .removeClass('hidden');
  };

  UIState.resumecall = function() {
    console.log('resumecall');

    $('#hold-call-btn')
      .removeClass('hidden');
    $('#resume-call-btn')
      .addClass('hidden');
  };
  // Event handler for callincoming event
  function onCallIncoming(call, isAnonymous) {
    $audioRingIn[0].play();
    callId = call.getId();

    if (!isAnonymous) {
      $('#username-incoming')
        .text(call.callerName + ' Calling!');
    } else {
      $('#username-incoming')
        .text('Anonymous Calling');
    }

    UIState.callincoming();
  }

  // Event handler for oncallanswered event
  function onCallAnswer(call) {
    callId = call.getId();

    $audioRingOut[0].pause();
    $audioRingIn[0].pause();
  }

  // Event handler for callrejected event
  function onCallRejected() {
    console.debug('callrejected');
    callId = null;
    $audioRingIn[0].pause();
    UIState.callrejected();
    alert('Call Rejected');
  }

  // Event handler for call answer button
  $('#answer-call-btn')
    .on('click', function() {
      kandy.call.answerCall(callId, true);
      UIState.oncall();
    });

  // Event handler for call reject button
  $('#reject-call-btn')
    .on('click', function() {
      kandy.call.rejectCall(callId);
      UIState.initial();
    });

  UIState.callincoming = function() {
    console.log('call incoming');

    $('#call-form, #call-connected')
      .addClass('hidden');
    $('#incoming-call')
      .removeClass('hidden');
  };

  UIState.callrejected = function() {
    console.log('call rejected');

    $('#incoming-call')
      .addClass('hidden');
  };
});
