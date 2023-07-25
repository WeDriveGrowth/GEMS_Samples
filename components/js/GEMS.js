//
// the offical GEMS API wrapper / tag
// (c) 2023+ WeDriveGrowth
//
// version: 0.1.0
//

var GEMS = (function () {

    //
    // global state
    //

    const _root = "http://18.215.155.139:5001/api/";
    let _apiKey = "static api key";
    let _appId = null;  // string, set by init
    let _userId = null; // string, set by initUser


    //
    // helpers
    //

    var _getLocalTime = function () {
        const dateDataOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        const time = new Date();

        const currentDateUK = time.toLocaleString('en-UK', dateDataOptions);

        return currentDateUK;
    }

    //
    // exposed API
    //

    var init = function(apiKey, appId) {
        _appId = appId;
        _apiKey = apiKey;
    };

    var newUser = async function() {
        // returns string id
        try {
            const response = await fetch(_root+"newuser/"+_appId, {
                method: "POST",
                headers: {
                    apikey: _apiKey,
                },
                body: {
                }
            });
            const result = await response.json();
            _userId = result.user_id;
            return result.user_id;
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            return null;
        }

    };

    var initUser = function(userId) {
        _userId = userId;
    }

    var event = async function(name, data) {
        try {
            const response = await fetch(_root+"tag"+_appId, {
                method: "POST",
                headers: {
                    apikey: _apiKey,
                },
                body: {
                    user_id: _userId,
                    tagName: name,
                    localTime: _getLocalTime(),
                    data: data,
                }
            });
            return response;    
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            return null;
        }
    };

    return {
        init: init,         // GEMS.init(apiKey, appId)
        initUser: newUser,  // GEMS.newUser(userId)
        initUser: initUser, // GEMS.initUser(userId)
        event: event,       // GEMS.event(name, optionalData)
    };
})();

// typical flow for new user:
//
// GEMS.init("mykey", "myappid");
// const userId = await GEMS.newUser();
// ... life happens ...
// GEMS.event("game completed", {level:5});


// typical flow for existing user:
//
// GEMS.init("mykey", "myappid");
// GEMS.initUser(userId);
// ... life happens ...
// GEMS.event("game completed", {level:5});



