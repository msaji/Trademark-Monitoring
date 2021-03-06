#!/usr/bin/env node

// 2. tm-monitor.js. Given a list of query strings in a file named
//    monitor-strings, searches the
//    latest TMOG (Trademark On-Line Gazette) to see if any new
//    applications have popped up. The output is placed into a
//    directory called "TMOG-Reports," with output from each TMOG
//    placed in a file named "TMOG-<date>-results".
//    Note that node 0.11 or higher is required for execSync.
// 	 
//    Based on an undocumented TMOG API. Use at your own risk.
//    The "<mark>" tag is added automatically by the TMOG.

var queriesArray, tmogDate;
var i, j, jsonResultsArray, tmogOutput, tmogOutputStr;

var upperLimit = 2000;

var INPUTFILE = "monitor-queries";
var OUTPUTPATH = "TMOG-Reports";

var fs = require('fs');
var child_process = require('child_process');

//	console.log(jsonResultsArray[i].cases[0].goodsServices); … jsonResultsArray[i].cases[j].seriaNum 

var queryMatchedDesc = function(i,j) {var re = new RegExp(queriesArray[i],'i'); if (re.test(jsonResultsArray[i].cases[j].markDescr)) return " <a href=\"#footnotes\" title=\"Your query term matched the verbal description of this mark. Click the TM serial no. for more details.\" class=\"matchedDesc footnote\">[1]</a> ";} // if no match, fail silently
var queryMatchedGoods = function(i,j) {var re = new RegExp(queriesArray[i],'i'); if (re.test(JSON.stringify(jsonResultsArray[i].cases[j].goodsServices))) return " <a href=\"#footnotes\" title=\"Your query term matched the goods and services listing of this mark. Click the TM serial no. for more details.\" class=\"matchedGoods footnote\">[2]</a> ";} // if no match, fail silently

// Open data file and create list of strings.
// Note that this array is not validated or cleaned.
queriesArray = fs.readFileSync(INPUTFILE, 'utf-8');
queriesArray = queriesArray.split('\n');

// Check to see if tmogDate was handed in as a command line argument
if (process.argv.indexOf("--tmogDate") != -1) {
	// Set tmogDate to the handed-in argument
	tmogDate = process.argv[process.argv.indexOf("--tmogDate")+1];
} else {
	// Get date of most recent TMOG, which comes out Tuesdays
	tmogDate = child_process.execSync('date -v-tuesday "+%G-%m-%d"');
}
tmogDate = tmogDate.toString().trim();
tmogDate = tmogDate.replace(/[^-0-9]/gi, '');

// Get results for each query string.
jsonResultsArray = [];
tmogOutput = [];
for (i=0; i<queriesArray.length; i++) {
//	console.log("Looping\n");
	queriesArray[i] = queriesArray[i].replace(/#.*/, ""); // Skip comments
	queriesArray[i] = queriesArray[i].trim();
	if (queriesArray[i].length < 1) { 
		continue;
	}
		
	var curlResults = child_process.execSync("curl '" + "https://tmog.uspto.gov/eOG/search/all/info.json?searchBy=" + queriesArray[i] + "&searchIn=MARK_TEXT%2COWNER%2CMARK_DESC%2CGS_DESC%2CADD_STM%2CDOCKET_NR%2CSERIAL_NR%2CREG_NR&issues=" + tmogDate + "&pubReason=OPPOSITION&limit=" + upperLimit + "&orderBy=SERIAL_NR&order=ASC" + "'");
	if (curlResults.length > 1) {
		jsonResultsArray[i] = eval("results = " + curlResults.toString());
	} else {
		jsonResultsArray[i] = "";
//		console.log("jsonResultsArray has length 0")
	}
//	console.log(jsonResultsArray[i]);
//	console.log(jsonResultsArray[i].cases[0].goodsServices);

	// Pretty-print to buffer
	// Loop over results in the received JSON array
	// Note that "seriaNum" is a typo in the TMOG API.
	for (j=0; j < jsonResultsArray[i].totalCount; j++) {
		if (jsonResultsArray[i] == "") { continue; }
		tmogOutput[i] +=
			"<tr>" + 
			"<td class='query'>" + queriesArray[i] + queryMatchedDesc(i,j) + queryMatchedGoods(i,j) + "</td>" +
			"<td class='seriaNum'>" + "<a href='http://tsdr.uspto.gov/#caseNumber=" + jsonResultsArray[i].cases[j].seriaNum + "&caseType=SERIAL_NO&searchType=statusSearch'>" + jsonResultsArray[i].cases[j].seriaNum + "</a></td>" +
			"<td class='publicationDate'>" + jsonResultsArray[i].cases[j].publicationDate + "</td>" +
			"<td class='markText'>" + jsonResultsArray[i].cases[j].markText + "</td>" +
			"<td class='currentOwner'>" + jsonResultsArray[i].cases[j].currentOwner + "</td>" + 
			"</tr>";
//		console.log(i);
//		console.log(j);
//		console.log(tmogOutput[i]);
	}
}

// console.log("Reaching output buffer portion\n");

// Fill output buffer
tmogOutputStr = "<!DOCTYPE html> <html> <head> <style type='text/css'> table { font-family: Helvetica, Arial, sans-serif; color: #333; border-width: 1px; border-style: solid; border-color: #777; border-collapse: collapse; border-padding: 15px; } table th { background-color: #ddd; } table td { background-color: #fff; padding: 10px; } table .footnote { font-size: smaller; vertical-align: super; }</style> </head> <body> <h1>Trademark Gazette publications as of " + tmogDate + "</h1> <table border='1'> <tr> <th>Query</th> <th>TM serial no.</th> <th>Date of publication</th> <th>Trademark text</th> <th>Current owner</th> </tr> ";
for (i=0; i<queriesArray.length; i++) { if (tmogOutput[i]) { tmogOutputStr += tmogOutput[i]; } }
tmogOutputStr += "</table> <p>[1]: Your query term matched the verbal description of this mark. Click the TM serial no. for more details.</p><p>[2]: Your query term matched the goods and services listing of this mark. Click the TM serial no. for more details.</p> <a name=\"footnotes\">&nbsp;</a> </body> </html>";
tmogOutputStr = tmogOutputStr.replace(/undefined/gm, "");

// Output to file
fs.writeFileSync(OUTPUTPATH + "/TMOG-" + tmogDate + "-results.html", tmogOutputStr);
