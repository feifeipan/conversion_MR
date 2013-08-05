var request = require('request');
var fs = require('fs');

var mainChannels = ["酒店-国内","酒店-海外","机票-国内","机票-国际","旅游度假"];

//get main pages
var now = new Date();
var endTime = new Date();
var gap = 1;
var metricsName = "Conversion_Count";
if(now.getHours() == 0 && now.getMinutes() == 0 && now.getSeconds() == 0){
	gap = 24;
	metricsName = "Conversion_Count_Daily";
}
now.setHours(now.getHours() - gap);
var startTime = now;
var endTimeStr = [endTime.getFullYear(), endTime.getMonth()+1, endTime.getDate()].join("-") + " " + [endTime.getHours(), endTime.getMinutes(), endTime.getSeconds()].join(":");

var config = {
	"uat":{
		"getpages":"http://svn.ui.sh.ctripcorp.com/p/getpages.php",
		"getcv":"http://192.168.81.210:8080/ubt/conversion/fuzzy/page/",
		"dashboardurl":"http://192.168.82.83:8060/metrics/putdatapoints"
	},
	"pro":{
		"getpages":"http://svn.ui.sh.ctripcorp.com/p/getpages.php",
		"getcv":"http://192.168.49.113:8080/ubt/conversion/fuzzy/page/",
		"dashboardurl":"http://engine.dashboard.sh.ctriptravel.com:8080/metrics/putdatapoints"
	}
}

function pushConversionData(config, index){
	var tempChannel = mainChannels[index];
	var url = config["getpages"] +"?cname="+tempChannel+"&flow=1";
	request(url, function(error, response, body){
		var steps = [];
		if (!error && response.statusCode == 200) {
			var pages = JSON.parse(body);
			for(var i=0,l=pages.length; i<l; i++){
				steps.push(pages[i]["pageid"]);
			}
		}
		var params = {
			"steps": steps.join("/"),
			"start": startTime.getTime(),
			"stop": endTime.getTime()
		}

		var conversionUrl = config["getcv"]+params["steps"]+"?start="+params["start"]+"&stop="+params["stop"];

		request(conversionUrl, function(error, response, body){
			if (!error && response.statusCode == 200) {
				var conversionInfo = JSON.parse(body);
				//remove useless path
				var goals = conversionInfo["goals"];
				var trueGoals = [];
				var trueData = [];
				for(var i=0,l=goals.length; i<l; i++){
					if(goals[i]["name"] != "*"){
						trueGoals.push(goals[i]);
					}
				}

				for(var m=0,n=trueGoals.length; m<n; m++){
					trueData.push({
						 "time-series": {
					                "namespace": "cdp", 
					                "metrics-name": metricsName, 
					                "tags": {
					                    "channel": tempChannel,
					                    "step":m,
					                    "pageid":trueGoals[m]["name"].replace("pid_", "")
					                }
					            },  
					            "value-type": "long", 
					            "data-points": [
					                {
					                    "timestamp": endTimeStr,
					                    "value": trueGoals[m]["conversionCount"]
					                }
					            ]
					        });
				}

				var data = {
				    "version": 1, 
				    "time-series-list": trueData
				};

				request.post(config["dashboardurl"], {form:{"reqdata":JSON.stringify(data)}}, function(error, response, body){
					var logFile = fs.createWriteStream('/data/node/cron/log.txt', {
					  flags: "a",
					  encoding: "encoding",
					  mode: 0744
					})
					   //call the write option where you need to append new data
					logFile.write(endTimeStr + ': ' + body + "\r\n");
				});
			}
		});
	});
}


for(var i=0,l=mainChannels.length; i<l; i++){
	(function(i){
		pushConversionData(config["uat"], i);
		pushConversionData(config["pro"], i);
	})(i);
}
// http://192.168.49.113:8080/ubt/conversion/fuzzy/page/102001/102002993/102005/102202003/102007991?start=1374976800000&stop=1374980400000

//http://192.168.81.210:8080/ubt/conversion/fuzzy/page/100101991/100003/100101991?start=1372322693000&stop=1372329893000 