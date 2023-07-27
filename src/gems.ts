//
// the offical GEMS API wrapper / tag
// (c) 2023+ WeDriveGrowth
//
// version: 0.1.0
//
// credits:
// confetti by mathusummut, MIT license: https://www.cssscript.com/confetti-falling-animation/

//
// global state
//

export interface GEMSInitParams {
    apiKey: string;
    appId: string;
    userId?: string;
    useCookie?: boolean;
}

export interface GEMSAchievement {
    title: string;
    image: string;
    description: string;
    localTime: string;
}

export interface GEMSState {
    apiKey?: string; // will only be stored for a short time
    appId?: string;
    userId?: string;
    token?: string;
};

class Particle {
    color: string = "";
    x: number = 0;
    y: number = 0;
    diameter: number = 0;
    tilt: number = 0;
    tiltAngleIncrement: number = 0;
    tiltAngle: number = 0;
};

export class GEMS {
    private static _root = "https://gemsapi.bayz.ai/api/";
    private static state: GEMSState = {};
    //
    // helpers
    //

    private static _getLocalTime() {
        const dateDataOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        const time = new Date();
        const currentDateUK = time.toLocaleString('en-UK', dateDataOptions as any);
        return currentDateUK;
    }

    private static async _wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private static async _waitForNextEvent(element: HTMLElement, name: string) {
        return new Promise((resolve) => {
            element.addEventListener(name, (e) => resolve(true), { once: true });
        });
    }

    //
    // exposed API
    //

    static async init(params: GEMSInitParams): Promise<GEMSState> {
        console.assert(params.appId);
        console.assert(params.apiKey);
        this.state = { ...params };
        delete this.state.apiKey;

        try {
            if (!params.userId && params.useCookie) {
                this.state.userId = this._getCookie("gems-user-id");
            }

            let url = this._root + "user/" +
                params.appId +
                (params.userId ? "/" + params.userId : "");

            const response = await this.fetch(url, {
                method: "POST",
                headers: {
                    apikey: params.apiKey,
                },
            });
            const result = await response.json();
            console.log("fetch: result: " + JSON.stringify(result));
            this.state.userId = result.user_id;
            this.state.token = result.token;

            if (params.useCookie) {
                this._setCookie("gems-user-id", this.state.userId!, 365);
            }

            return {
                userId: this.state.userId,
                token: this.state.token,
            };
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            throw error;
        }
    }

    static setClientCredentials(appId: string, userId: string, token: string) {
        this.state.appId = appId;
        this.state.userId = userId;
        this.state.token = token;
    }

    static async event(name: string, data: any = {}, options: {
        displayAll?: boolean,
        displayFirst?: boolean,
    } = { displayFirst: true }) {
        let result;
        try {
            const response = await this.fetch(this._root + "tag/" + this.state.appId, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + this.state.token,
                    "Accept": "application/json",
                },
                body: {
                    user_id: this.state.userId,
                    tagName: name,
                    localTime: this._getLocalTime(),
                    data: data,
                } as any,
            });
            result = await response.json();
            console.log("fetch: result: " + JSON.stringify(result));

            if (typeof window !== "undefined") {
                if (options.displayAll) {
                    for (let a of result.achievements) {
                        await this.displayAchievement(a);
                    }
                } else if (options.displayFirst) {
                    if (result.achievements && result.achievements.length > 0) {
                        await this.displayAchievement(result.achievements[0]);
                    }
                }
            }
            return result;
        } catch (error) {
            console.error("GEMS API error:")
            console.error(error);
            return null;
        }
    };

    static async displayAchievement(achievement: GEMSAchievement) {
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

        this._startConfettiInner();
        setTimeout(() => this._stopConfettiInner(), 3000);

        // wait for click outside frame
        await this._waitForNextEvent(scrim, "click");
        this._stopConfettiInner();

        // cleanup
        scrim.remove();
    };

    private static _colors: string[] = ["DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", "LightBlue", "Violet", "PaleGreen", "SteelBlue", "SandyBrown", "Chocolate", "Crimson"]
    private static streamingConfetti: boolean = false;
    private static animationTimer: any = null;
    private static particles: Particle[] = [];
    private static waveAngle: number = 0;
    // confetti config
    private static maxParticleCount = 150; //set max confetti count
    private static particleSpeed = 2; //set the particle animation speed

    private static resetParticle(particle: Particle, width: number, height: number): Particle {
        particle.color = this._colors[(Math.random() * this._colors.length) | 0];
        particle.x = Math.random() * width;
        particle.y = Math.random() * height - height;
        particle.diameter = Math.random() * 10 + 5;
        particle.tilt = Math.random() * 10 - 10;
        particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
        particle.tiltAngle = 0;
        return particle;
    }

    private static _startConfettiInner() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let canvas = document.createElement("canvas");
        canvas.setAttribute("id", "confetti-canvas");
        canvas.setAttribute("style", "display:block;z-index:999999;pointer-events:none; position:fixed; top:0; left: 0;");
        document.body.appendChild(canvas);
        canvas.width = width;
        canvas.height = height;
        window.addEventListener("resize", function () {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }, true);

        let context = canvas.getContext("2d");
        while (this.particles.length < this.maxParticleCount)
            this.particles.push(this.resetParticle(new Particle(), width, height));
        this.streamingConfetti = true;
        if (this.animationTimer === null) {
            const runAnimation = () => {
                context!.clearRect(0, 0, window.innerWidth, window.innerHeight);
                if (this.particles.length === 0)
                    this.animationTimer = null;
                else {
                    this.updateParticles();
                    this.drawParticles(context!);
                    this.animationTimer = window.requestAnimationFrame(runAnimation);
                }
            };
            runAnimation();
        }
    }

    private static _stopConfettiInner() {
        this.streamingConfetti = false;
    }

    private static drawParticles(context: CanvasRenderingContext2D) {
        let particle;
        let x;
        for (var i = 0; i < this.particles.length; i++) {
            particle = this.particles[i];
            context.beginPath();
            context.lineWidth = particle.diameter!;
            context.strokeStyle = particle.color!;
            x = particle.x! + particle.tilt!;
            context.moveTo(x + particle.diameter! / 2, particle.y!);
            context.lineTo(x, particle.y! + particle.tilt! + particle.diameter! / 2);
            context.stroke();
        }
    }

    private static updateParticles() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let particle;
        this.waveAngle += 0.01;
        for (var i = 0; i < this.particles.length; i++) {
            particle = this.particles[i];
            if (!this.streamingConfetti && particle.y! < -15)
                particle.y = height + 100;
            else {
                particle.tiltAngle += particle.tiltAngleIncrement;
                particle.x += Math.sin(this.waveAngle);
                particle.y += (Math.cos(this.waveAngle) + particle.diameter + this.particleSpeed) * 0.5;
                particle.tilt = Math.sin(particle.tiltAngle) * 15;
            }
            if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
                if (this.streamingConfetti && this.particles.length <= this.maxParticleCount)
                    this.resetParticle(particle, width, height);
                else {
                    this.particles.splice(i, 1);
                    i--;
                }
            }
        }
    }

    // alternate fetch for node 16
    private static async fetch(url: string, init: RequestInit): Promise<Response> {
        console.log("fetch: " + init.method + ": " + url);
        console.log("    headers: " + JSON.stringify(init.headers));
        console.log("    body   : " + JSON.stringify(init.body));
        if (typeof window !== "undefined") {
            let response;
            try {
                response = await fetch(url, init);
            } catch (error) {
                console.log("fetch: error response: " + error);
                throw error;
            }
            return response;
        }

        const p: Promise<Response> = new Promise((resolve, reject) => {

            const xhr = new XMLHttpRequest();
            let method = init.method ?? "GET";

            // process headers
            for (const headerKey in init.headers) {
                const headerValue = (init as any).headers[headerKey];
                xhr.setRequestHeader(headerKey, headerValue);
            }

            // process body
            const formData = new FormData();
            for (const itemKey in init.body as any) {
                const item = (init.body as any)[itemKey];
                formData.append(itemKey, item);
            }

            // resolve/reject
            xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    console.log("fetch: response: " + JSON.stringify(this.response));
                    resolve(this.response);
                } else if (this.readyState == 4 && this.status !== 200) {
                    console.log("fetch: error response");
                    console.log(this);
                    reject(this);
                }
            };

            // send it, async
            xhr.open(method, url, true);
            xhr.send(formData);
        });
        return p;
    }

    // cookies
    private static _setCookie(cname: string, cvalue: string, exdays: number) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    private static _getCookie(cname: string): string {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
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
}

function _createStyle() {
    const style = document.createElement("style");
    const css = `
    .GEMS-scrim {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    
    .GEMS-achievement-frame {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        border-radius: 5px;
        box-shadow: '4px 8px 36px #F4AAB9';
        background-color: white;
        width:600px;
        height: 400px;
        font-family: Arial, Helvetica, sans-serif;
    }
    
    .GEMS-achievement-title {
        margin: 10px;
    }
    
    .GEMS-achievement-image {
        width: 100;
        height: 100;
        border-radius: 5px;
        box-shadow: '4px 8px 36px #F4AAB9';
    }
    
    .GEMS-achievement-description {
        margin: 10px;
    }
    `;
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

if (typeof window !== "undefined") {
    // in browser
    _createStyle();
    (window as any)["GEMS"] = GEMS;
}

