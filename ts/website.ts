import {config} from "./config";

interface Highlight {
    title: string;
    description: string;
    preview: string;
    show: () => void;
}

export class Website {
    channel: string;
    channelId: number;

    liveClass: string;
    liveStatus: string;
    livePreview: string;

    clickblockerClass: string;
    popupClass: string;
    popupUrl: string;

    highlights: Highlight[];

    constructor() {
        this.log("Initializing");
        this.channel = config.channel;
        this.channelId = config.channelId;

        this.liveClass = "live hidden";
        this.liveStatus = "";
        this.livePreview = "";

        this.clickblockerClass = "clickblocker hidden";
        this.popupClass = "popup hidden";
        this.popupUrl = "";

        this.highlights = [];

        document.querySelector(".clickblocker").addEventListener("click", this.onClickblockerClick.bind(this));
    }

    public start() {
        this.log("Starting up");

        var element = document.querySelector("body");
        rivets.bind(element, this);

        this.loadHighlights();
        this.checkLive();
    }

    private offline() {
        this.liveClass = "live hidden";
    }

    private online(status: string, preview: string) {
        this.liveClass = "live";
        this.liveStatus = status;
        this.livePreview = preview;
    }

    private onClickblockerClick() {
        this.log("Clickblocker clicked");
        this.clickblockerClass = "clickblocker hidden";
        this.popupClass = "popup hidden";
        this.popupUrl = "";
    }

    private loadHighlights() {
        let _this = this;
        let url = `https://api.twitch.tv/kraken/channels/${this.channel}/videos`;

        _this.log("Loading highlights");

        this.getUrl(url, function (req) {
            if (req.status !== 200) {
                return;
            }

            let data = JSON.parse(req.responseText);

            data.videos.forEach(function (video: any) {
                let videoUrl = `https://player.twitch.tv/?video=${video._id}`;

                _this.highlights.push({
                    title: video.title,
                    description: video.description,
                    preview: video.preview,
                    show: function () {
                        _this.showVideo(videoUrl);
                    },
                });
            });

            _this.log("Loaded highlights");
            _this.log(_this.highlights);
        });
    }

    private showVideo(url: string) {
        this.popupClass = "popup";
        this.clickblockerClass = "clickblocker";
        this.popupUrl = url;
    }

    private checkLive() {
        let _this = this;
        let url = `https://api.twitch.tv/kraken/streams/${this.channel}`;

        this.getUrl(url, function(req) {
            if (req.status !== 200) {
                return;
            }

            let data = JSON.parse(req.responseText);

            if (!data.stream) {
                _this.offline();
            } else {
                _this.online(data.stream.channel.status, data.stream.preview.large);
            }

            setTimeout(_this.checkLive.bind(_this), 60000);
        });
    }

    private getUrl(url: string, callback: (req: XMLHttpRequest) => void) {
        let STATES = {
            0: "UNSENT",
            1: "OPENED",
            2: "HEADERS_RECEIVED",
            3: "LOADING",
            4: "DONE"
        };

        var req = new XMLHttpRequest();
        req.onload = function () {
            console.log(url + " loaded");
            callback(req);
        };
        req.onreadystatechange = function () {
            let state: string = (<any>STATES)[req.readyState];
            console.log(url + ": " + state);
        };

        req.open('GET', url, true);
        req.send();
    }

    private log(...args: any[]) {
        if (console && console.log) {
            args.unshift(this.getTimestamp());
            console.log.apply(console, args);
        }
    }

    private getTimestamp(): string {
        return String(new Date());
    }
}

