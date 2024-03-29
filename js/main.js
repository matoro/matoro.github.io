var global_configdata = null;

function load_dynamic_content()
{
    var config_request = new XMLHttpRequest();
    config_request.onreadystatechange = function()
    {
        if(this.readyState === 4 && this.status === 200)
        {
            process_user_configuration(JSON.parse(this.responseText));
        }
    };
    config_source = "https://" + (new URL(window.location)).searchParams.get("source") +
        "/" + (new URL(window.location)).searchParams.get("profile") + ".json"
    config_request.open("GET", config_source, true);
    config_request.send();
}

function process_user_configuration(configdata)
{
    global_configdata = configdata;

    document.getElementById("timeprompt").textContent = configdata.boxes.timebox.prompt;
    document.getElementById("timetext").textContent = configdata.placeholder;

    document.getElementById("ipprompt").textContent = configdata.boxes.ipbox.prompt;
    document.getElementById("iptext").textContent = configdata.placeholder;

    document.getElementById("torprompt").textContent = configdata.boxes.torbox.prompt;
    document.getElementById("tortext").textContent = configdata.placeholder;

    document.getElementById("weatherprompt").textContent = configdata.boxes.weatherbox.prompt;
    document.getElementById("weathertext").textContent = configdata.placeholder;

    document.getElementById("newsprompt").textContent = configdata.boxes.newsbox.prompt;
    document.getElementById("rssprompt").textContent = configdata.boxes.rssbox.prompt;
    document.getElementById("linkprompt").textContent = configdata.boxes.linkbox.prompt;

    document.getElementById("searchprompt").textContent = configdata.boxes.searchbox.prompt;
    document.getElementById("searchtext").textContent = configdata.placeholder;

    populate_timebox();
    populate_linkbox(configdata.boxes.linkbox);
    populate_searchbox(configdata.boxes.searchbox);
    window.setInterval(populate_timebox, 1000);

    load_remote_services();
}

// The timebox accepts two attributes:
//  "locale" which sets the default way the date is rendered
//  "options", which corresponds to a DateTimeFormat object:
//  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
function populate_timebox()
{
    var locale = global_configdata.boxes.timebox.hasOwnProperty("locale") ? global_configdata.boxes.timebox.locale : "en-US";
    var options = global_configdata.boxes.timebox.hasOwnProperty("options") ? global_configdata.boxes.timebox.options : {};
    document.getElementById("timetext").textContent = ((new Date()).toLocaleString(locale, options));
}

function populate_ipbox(ipdata)
{
    document.getElementById("iptext").textContent = ipdata;
}

function populate_torbox(tordata)
{
    document.getElementById("tortext").textContent = tordata;
}

function populate_weatherbox(weatherdata)
{
    document.getElementById("weathertext").textContent = weatherdata.main.temp + " degrees, " + weatherdata.weather[0].description;
}

function populate_newsbox(newsdata)
{
    var tr = document.createElement("tr");
    var cell = document.createElement("td");
    var story = document.createElement("a");
    story.appendChild(document.createTextNode(newsdata.title));
    story.setAttribute("href", newsdata.url);
    cell.appendChild(story);
    tr.appendChild(cell);
    document.getElementById("newstable").getElementsByTagName("tbody")[0].appendChild(tr);
}

function populate_rssbox(rssdata)
{
    var tr = document.createElement("tr");
    var cell = document.createElement("td");
    var item = document.createElement("a");
    item.appendChild(document.createTextNode(rssdata.title));
    item.setAttribute("href", rssdata.url);
    cell.appendChild(item);
    tr.appendChild(cell);
    document.getElementById("rsstable").getElementsByTagName("tbody")[0].appendChild(tr);
}

function populate_linkbox(linkdata)
{
    for(var group = 0; group < linkdata.groups.length; group++)
    {
        var tr = document.createElement("tr");
        var header = document.createElement("td");
        header.appendChild(document.createTextNode(linkdata.groups[group].group + " >> "));
        tr.appendChild(header);
        for(var link = 0; link < linkdata.groups[group].links.length; link++)
        {
            var td = document.createElement("td");
            var linktext = document.createElement("a");
            linktext.setAttribute("href", linkdata.groups[group].links[link].url);
            linktext.setAttribute("rel", "noreferrer noopener");
            linktext.appendChild(document.createTextNode(linkdata.groups[group].links[link].title));
            td.appendChild(linktext);
            tr.appendChild(td);
        }
        document.getElementById("linktable").getElementsByTagName("tbody")[0].appendChild(tr);
    }
}

function populate_searchbox(searchdata)
{
    var form = document.createElement("form");
    form.setAttribute("id", "searchtext");
    form.setAttribute("action", searchdata.action);
    var input = document.createElement("input");
    input.setAttribute("id", "searchinput");
    input.setAttribute("name", searchdata.param);
    input.setAttribute("autofocus", "");
    form.appendChild(input);
    document.getElementById("searchtext").replaceWith(form);
    document.getElementById("searchinput").focus();
}

//The following function is used to load remote services not hosted on the same domain.
//To disable a particular remote service, simply comment out the block of lines which dynamically load its script.
//The text on the page will continue to display the contents of the "placeholder" string from your user.json file.
function load_remote_services()
{
    //Remote service:  onion.to
    //Populates:       ipbox, torbox
    //Rate limit:      Not specified
    //Documentation:   https://github.com/globaleaks/Tor2web/wiki/CheckTor
    /*
    var remote_service_ip = document.createElement("script");
    remote_service_ip.setAttribute("type", "application/javascript");
    remote_service_ip.text = " \
        var remote_request_ip = new XMLHttpRequest();\n \
        remote_request_ip.onreadystatechange = function()\n \
        {\n \
            if(this.readyState === 4 && this.status === 200)\n \
            {\n \
                populate_ipbox((JSON.parse(this.responseText)).IP);\n \
                populate_torbox((JSON.parse(this.responseText)).IsTor);\n \
            }\n \
        };\n \
        remote_request_ip.overrideMimeType(\"application/json\");\n \
        remote_request_ip.open(\"GET\", \"https://onion.to/checktor\", true);\n \
        remote_request_ip.send();";
    document.head.appendChild(remote_service_ip);
    */

    //Remote service:   WTF is my IP
    //Populates:        ipbox, torbox
    //Rate limit:       1 call/min/IP
    //Documentation:    https://wtfismyip.com/automation
    var remote_service_ip = document.createElement("script");
    remote_service_ip.setAttribute("type", "application/javascript");
    remote_service_ip.text = " \
        var remote_request_ip = new XMLHttpRequest();\n \
        remote_request_ip.onreadystatechange = function()\n \
        {\n \
            if(this.readyState === 4 && this.status === 200)\n \
            {\n \
                var remote_response = JSON.parse(this.responseText);\n \
                var remote_string_ip = remote_response.YourFuckingIPAddress + \", \"\n \
                    + remote_response.YourFuckingISP + \", \"\n \
                    + remote_response.YourFuckingLocation;\n \
                if(remote_response.YourFuckingTorExit === false)\n \
                {\n \
                    var remote_string_tor = \"no\";\n \
                }\n \
                else\n \
                {\n \
                    var remote_string_tor = \"yes, exit node: \"\n \
                        + remote_response.YourFuckingTorExit;\n \
                }\n \
                populate_ipbox(remote_string_ip);\n \
                populate_torbox(remote_string_tor);\n \
            }\n \
        }\n \
        remote_request_ip.overrideMimeType(\"application/json\");\n \
        remote_request_ip.open(\"GET\", \"https://wtfismyip.com/json\", true);\n \
        remote_request_ip.send();";
    document.head.appendChild(remote_service_ip);
    
    //Remote service:  Yahoo Weather
    //Populates:       weatherbox
    //Rate limit:      2000 calls/day
    //Documentation:   https://developer.yahoo.com/weather/
    /*
    var remote_service_weather = document.createElement("script");
    remote_service_weather.setAttribute("type", "application/javascript");
    remote_service_weather.setAttribute("src", "https://query.yahooapis.com/v1/public/yql?q=select item.condition from weather.forecast where woeid in (select woeid from geo.places(1) where text='" + global_configdata.boxes.weatherbox.geo + "')&format=json&callback=populate_weatherbox");
    document.head.appendChild(remote_service_weather);
    */

    //Remote service:  OpenWeatherMap
    //Populates:       weatherbox
    //Rate limit:      60 calls/min
    //Documentation:   https://openweathermap.org/api
    var remote_service_weather = document.createElement("script");
    remote_service_weather.setAttribute("type", "application/javascript");
    remote_service_weather.setAttribute("src", "https://api.openweathermap.org/data/2.5/weather?units=imperial&id=" + global_configdata.boxes.weatherbox.geo + "&callback=populate_weatherbox&APPID=" + global_configdata.boxes.weatherbox.apikey);
    document.head.appendChild(remote_service_weather);

    //Remote service:  Hacker News
    //Populates:       newsbox
    //Rate limit:      Not specified
    //Documentation:   https://github.com/HackerNews/API
    var remote_service_news = document.createElement("script");
    remote_service_news.setAttribute("type", "application/javascript");
    remote_service_news.text = " \
        var remote_request_news = new XMLHttpRequest();\n \
        remote_request_news.onreadystatechange = function()\n \
        {\n \
            if(this.readyState === 4 && this.status === 200)\n \
            {\n \
                var remote_request_news_items = [];\n \
                for(var ticker = 0; ticker < Math.min((JSON.parse(this.responseText)).length, global_configdata.boxes.newsbox.stories); ticker++)\n \
                {\n \
                    remote_request_news_items.push(new XMLHttpRequest());\n \
                    remote_request_news_items[ticker].onreadystatechange = function()\n \
                    {\n \
                        if(this.readyState === 4 && this.status === 200)\n \
                        {\n \
                            populate_newsbox(JSON.parse(this.responseText));\n \
                        }\n \
                    };\n \
                    remote_request_news_items[ticker].overrideMimeType(\"application/json\");\n \
                    remote_request_news_items[ticker].open(\"GET\", \"https://hacker-news.firebaseio.com/v0/item/\" + (JSON.parse(this.responseText))[ticker] \+ \".json\", true);\n \
                    remote_request_news_items[ticker].send();\n \
                }\n \
            }\n \
        };\n \
        remote_request_news.open(\"GET\", \"https://hacker-news.firebaseio.com/v0/topstories.json\", true);\n \
        remote_request_news.send();";
    document.head.appendChild(remote_service_news);

    //Remote service:   Miniflux (self-hosted)
    //Populates:        rssbox
    //Rate limit:       N/A (self-hosted)
    //Documentation:    https://miniflux.app/docs/api.html
    //Note, make sure you allow CORS access!
    var remote_service_rss = document.createElement("script");
    remote_service_rss.setAttribute("type", "application/javascript");
    remote_service_rss.text = " \
        var remote_request_rss = new XMLHttpRequest();\n \
        remote_request_rss.onreadystatechange = function()\n \
        {\n \
            if(this.readyState === 4 && this.status === 200)\n \
            {\n \
                for(var ticker = 0; ticker < Math.min((JSON.parse(this.responseText)).total, global_configdata.boxes.rssbox.items); ticker++)\n \
                {\n \
                    populate_rssbox(JSON.parse(this.responseText).entries[ticker]);\n \
                }\n \
            }\n \
        };\n \
        remote_request_rss.overrideMimeType(\"application/json\");\n \
        remote_request_rss.open(\"GET\", \"https://\" + global_configdata.boxes.rssbox.host + \"/v1/entries?direction=desc&limit=\" + global_configdata.boxes.rssbox.items, true);\n \
        remote_request_rss.setRequestHeader(\"X-Auth-Token\", global_configdata.boxes.rssbox.apikey);\n \
        remote_request_rss.send();";
    document.head.appendChild(remote_service_rss);

    /*
    var remote_service_stocks = document.createElement("script")
    remote_service_stocks.setAttribute("type", "application/javascript");
    remote_service_stocks.setAttribute("src", "http://widgets.macroaxis.com/widgets/url.jsp?t=42");
    document.head.appendChild(remote_service_stocks);
    */
}
