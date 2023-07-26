//
// the offical GEMS API wrapper / tag
// (c) 2023+ WeDriveGrowth
//
// version: 0.1.0
//
// credits:
// confetti by mathusummut, MIT license: https://www.cssscript.com/confetti-falling-animation/

const LOCALTEST=location.origin==="file://";

// confetti state
var maxParticleCount = 150; //set max confetti count
var particleSpeed = 2; //set the particle animation speed
var startConfetti; //call to start confetti animation
var stopConfetti; //call to stop adding confetti
var toggleConfetti; //call to start or stop the confetti animation depending on whether it's already running
var removeConfetti; //call to stop the confetti animation and remove all confetti immediately

//
// global state
//

const _root = "https://bayz.ai/api/";
let GEMS_state = {};

var GEMS = (function () {
    //
    // helpers
    //

    const _getLocalTime = function () {
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

    const _wait = async function(ms) {
        return new Promise((resolve)=>setTimeout(resolve, ms));
    }

    const _waitForNextEvent = function(element, name) {
        return new Promise((resolve)=>{
            element.addEventListener(name, (e)=>resolve(true), {once: true});
        });
    }

    //
    // exposed API
    //

    const init = async function(params = {}) {
        GEMS_state = {...params};
        delete GEMS_state.apiKey;
    
        try {
            if (LOCALTEST) {
                return { 
                    userId: "myid", 
                    token: "my token"
                };
            } else {
                if (!params.userId && params.useCookie) {
                    userId = _getCookie("gems-user-id");
                }
    
                let url = _root+"user/"+
                    params.appId+
                    (params.userId?"/"+params.userId:"");

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        apikey: params.apiKey,
                    },
                });
                const result = await response.json();
                GEMS_state.userId = result.user_id;
                GEMS_state.token = result.token;

                if (params.useCookie) {
                    _setCookie("gems-user-id", GEMS_state.userId);
                }

                return { 
                    userId: GEMS_state.userId, 
                    token: GEMS_state.token,
                };
            }
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            return null;
        }
    }

    const setClientCredentials = function(appId, userId, token) {
        GEMS_state.appId = appId;
        GEMS_state.userId = userId;
        GEMS_state.token = token;
    }

    const event = async function(name, data={}, options={displayAll:true}) {
        let result;
        try {
            if (LOCALTEST) {
                if (data.value > 50) {
                    result = {
                        achievements: [{
                            title: "You scored more than 50 points!",
                            image: "https://d2c8cl134xhhwp.cloudfront.net/trophy.png",
                            description: "Have a trophy!",
                        }],
                    }
                } else {
                    return {};
                }
            } else {
                const response = await fetch(_root+"tag/"+GEMS_state.appId, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": {
                            "Bearer": GEMS_state.token,
                        },
                        "Accept": "application/json",
                    },
                    body: {
                        user_id: GEMS_state.userId,
                        tagName: name,
                        localTime: _getLocalTime(),
                        data: data,
                    }
                });
                result = await response.json();
            }

            if (options.displayAll) {
                for (let a of result.achievements) {
                    await displayAchievement(a);
                }
            } else if (options.display) {
                if (result.achievements && result.achievements.length > 0) {
                    await displayAchievement(result.achievements[0]);
                }
            }
            return result;    
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            return null;
        }
    };

    const displayAchievement = async function(achievement) {
        // scrim
        const scrim = document.createElement("div");
        scrim.className = "GEMS-scrim";
        document.body.appendChild(scrim);

        // frame
        const frame = document.createElement("div");
        frame.className = "GEMS-achievement-frame";

        // content
        const title = document.createElement("h2");
        title.className = "GEMS-achievement-title";
        title.innerText = achievement.title;
        const image = document.createElement("img");
        image.className = "GEMS-achievement-image";
        image.src = achievement.image;
        const description = document.createElement("h3");
        description.className = "GEMS-achievement-description";
        description.innerText = achievement.description;

        frame.appendChild(title);
        frame.appendChild(image);
        frame.appendChild(description);
        scrim.appendChild(frame);

        startConfettiInner();
        setTimeout(()=>stopConfettiInner(), 3000);

        // wait for click outside frame
        await _waitForNextEvent(scrim, "click");
        stopConfettiInner();
        
        // cleanup
        scrim.remove();
    };

    // const _createStyle = function() {
    //     const style = document.createElement("style");
    //     const css = `
    //     `;
    //     style.appendChild(document.createTextNode(css));
    //     document.head.appendChild(style);
    // }

	var colors = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"]
	var streamingConfetti = false;
	var animationTimer = null;
	var particles = [];
	var waveAngle = 0;
	
	function resetParticle(particle, width, height) {
		particle.color = colors[(Math.random() * colors.length) | 0];
		particle.x = Math.random() * width;
		particle.y = Math.random() * height - height;
		particle.diameter = Math.random() * 10 + 5;
		particle.tilt = Math.random() * 10 - 10;
		particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
		particle.tiltAngle = 0;
		return particle;
	}

	function startConfettiInner() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		window.requestAnimFrame = (function() {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function (callback) {
					return window.setTimeout(callback, 16.6666667);
				};
		})();
        var canvas = document.createElement("canvas");
        canvas.setAttribute("id", "confetti-canvas");
        canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none; position:fixed; top:0; left: 0;");
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        window.addEventListener("resize", function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }, true);

		var context = canvas.getContext("2d");
		while (particles.length < maxParticleCount)
			particles.push(resetParticle({}, width, height));
		streamingConfetti = true;
		if (animationTimer === null) {
			(function runAnimation() {
				context.clearRect(0, 0, window.innerWidth, window.innerHeight);
				if (particles.length === 0)
					animationTimer = null;
				else {
					updateParticles();
					drawParticles(context);
					animationTimer = requestAnimFrame(runAnimation);
				}
			})();
		}
	}

	function stopConfettiInner() {
		streamingConfetti = false;
	}

	function removeConfettiInner() {
		stopConfetti();
		particles = [];
	}

	function drawParticles(context) {
		var particle;
		var x;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			context.beginPath();
			context.lineWidth = particle.diameter;
			context.strokeStyle = particle.color;
			x = particle.x + particle.tilt;
			context.moveTo(x + particle.diameter / 2, particle.y);
			context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
			context.stroke();
		}
	}

	function updateParticles() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		var particle;
		waveAngle += 0.01;
		for (var i = 0; i < particles.length; i++) {
			particle = particles[i];
			if (!streamingConfetti && particle.y < -15)
				particle.y = height + 100;
			else {
				particle.tiltAngle += particle.tiltAngleIncrement;
				particle.x += Math.sin(waveAngle);
				particle.y += (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
				particle.tilt = Math.sin(particle.tiltAngle) * 15;
			}
			if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
				if (streamingConfetti && particles.length <= maxParticleCount)
					resetParticle(particle, width, height);
				else {
					particles.splice(i, 1);
					i--;
				}
			}
		}
	}

    // cookies
    function _setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
      
    function _getCookie(cname) {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    return {
        init: init,                                    // GEMS.init(apiKey, appId)
        setClientCredentials: setClientCredentials,    // to set the credentials returned by init
        event: event,                                  // GEMS.event(name, data, options)
    };
})();

// revised flow
// const {userId, token} = await GEMS.init({apiKey:"mykey", appId:"myappid"});
// // to use cookie, pass useCookie:true

// // if the above call happened on the server, report results and appId to the client, then:
// GEMS.setClientCredentials(appId, userId, token);

// // ... life happens ...
// GEMS.event("game completed", {value:50});




