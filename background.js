// tasks
var tasks = [];

// classes
var classes = [];

// pomdoro
var intervalTimer;
var localTimeLeft = -1;
var pomodoro_work = true;
var timerRunning = false;
var break_time = 5;
var work_time = 25;

chrome.runtime.onInstalled.addListener(function () {
  
  chrome.storage.sync.set({mainbgcolor: '#F2F2F2', elementcolor:'#ffffff', textcolor: '#404040', sliderlight: '#A7ACC6', sliderdark: '#4E598C', radiofill: '#f7a191', timermain: '#4E598C'}, function() {
    console.log('Value is set for light mode');
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [new chrome.declarativeContent.PageStateMatcher({})],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.identity.getAuthToken({ interactive: true }, function (token) {
  //console.log(token);
});

chrome.identity.getProfileUserInfo(function (info) {
  email = info.email;
  id = info.id;
  // console.log(email);
  // console.log(id);
});




chrome.runtime.onInstalled.addListener(function (request) {
  console.log("Getting message");
  var settings = {
    url: "https://us-central1-aiot-fit-xlab.cloudfunctions.net/gettasksbyuser",
    type: "POST",
    //timeout: 0,
    success: function (data) {
      console.log(data);
    },
    error: (err) => {
      console.log(err.responseJSON);
    },
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    data: JSON.stringify({ uid: "1" }),
    dataType: "json",
  };

  $.ajax(settings);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  if (request.greeting == "hello") sendResponse({ farewell: "goodbye" });
  if (request.get == "timer" && !sender.tab) sendResponse({ timeLeft: localTimeLeft, pomodoro_work: pomodoro_work, timer_running: timerRunning });
});

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    if (msg.action == "Update tasks") {
      var in_list = false;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].includes(msg.task) && tasks[i].includes(msg.section)) {
          tasks[i] = [msg.task, msg.checked, msg.section];
          in_list = true;
        }
      }
      if (!in_list)
        tasks = tasks.concat([[msg.task, msg.checked, msg.section]]);
    }

    else if (msg.action == "Get tasks") {
      port.postMessage({ tasks: tasks, signature: msg.signature });
    }
    
    if (msg.action == "Update classes") {
      // var in_list = false;
      // for (var i = 0; i < tasks.length; i++) {
      //   if (tasks[i].includes(msg.task) && tasks[i].includes(msg.section)) {
      //     tasks[i] = [msg.task, msg.checked, msg.section];
      //     in_list = true;
      //   }
      // }
      // if (!in_list)
        classes = classes.concat(msg.class);
    }

    else if (msg.action == "Get classes") {
      port.postMessage({ classes: classes, signature: msg.signature });
    }

    else if (msg.action == "Remove task") {
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].includes(msg.task) && tasks[i].includes(msg.section))
          tasks.pop(i);
      }
    }

    else if (msg.action == "Update times") {
      break_time = msg.break_time;
      work_time = msg.work_time;
    }

    else if (msg.action == "Get times") {
      port.postMessage({ break_time: break_time, work_time: work_time, signature: msg.signature });
    }

    else if (msg.action == "Timer" || msg.action == "Stop Timer") {
      console.log("Timer");
      if (msg.seconds == null || msg.timeLeft < 0 || msg.action == "Stop Timer") {
        clearInterval(intervalTimer);
        timerRunning = false;
        try { port.postMessage({ signature: "End Timer", timeLeft: localTimeLeft }); }
        catch { console.log("TRYING TO STOP")}
      } else {
        let remainTime = Date.now() + msg.seconds * 1000;
        chrome.tabs.getCurrent(function() { console.log(this) });
        intervalTimer = setInterval(function () {
          timerRunning = true;
          localTimeLeft = Math.round((remainTime - Date.now()) / 1000);
          if (localTimeLeft < 0) {
            console.log("TIMES UP!!");
            clearInterval(intervalTimer);
          }
          try { port.postMessage({ signature: "Timer", timeLeft: localTimeLeft, finished: localTimeLeft < 0 }); }
          catch { }
          console.log(localTimeLeft);
        }, 1000);
      }
    }
  });
});