#!/usr/bin/env node

// 1. tm-status.js. Given a list of US TM serial numbers to watch,
//    spits out a one-line status for each SN into a "Statuses"
//    directory. The list is kept in the text file "sn-list".

// curl -s http://tsdr.uspto.gov/statusview/sn86345980 | grep -B 1 -A 5 ">Status:" | tail -n 3 | head -n 1 | sed -E -e 's/[^-A-Za-z\., ]//g' -e 's/^ +//g'
// Get the last-modified file; diff the line.

var snList, todaysDate;
var i, j, statusList, statusesOutput;

var INPUTFILE = "sn-list";
var STATUSPATH = "Statuses";
var REPORTPATH = "Status-Reports"

var fs = require('fs');
var child_process = require('child_process');

// Open data file and create list of serial numbers.
// Note that this array is not validated or cleaned.
snList = fs.readFileSync(INPUTFILE, 'utf-8');
snList = snList.split('\n');

// Get date
todaysDate = child_process.execSync('date "+%G-%m-%d"');
todaysDate = todaysDate.toString().trim();

// Get results for each serial numbers.
statusesOutput = [];
for (i=0; i<snList.length; i++) {
	snList[i] = snList[i].replace(/#.*/, ""); // Skip comments
	snList[i] = snList[i].trim();
	if (snList[i].length < 1) { 
		continue;
	}
	
	var curlResults = child_process.execSync("curl -s '" + "http://tsdr.uspto.gov/statusview/sn" + snList[i] + "' | grep -B 1 -A 5 '>Status:' | tail -n 3 | head -n 1 | sed -E -e 's/[^-A-Za-z\., ]//g' -e 's/^ +//g'");

	// Get the latest prior status by comparing filenames; put it in statusList[0]
	statusList = fs.readdirSync(STATUSPATH + "/");
	for (j=0; j<statusList.length; j++) {
		if (statusList[0].search(/snList[i]/)) {
			statusList[0] = ((statusList[j] >= statusList[0]) ? statusList[j] : statusList[0]);
		}
	}

	// Push onto reporting list if the status has changed
	if (statusList[0] != curlResults) {
		statusesOutput.push(snList[i] + ": " + curlResults);
		// Save the latest status only if changed
		fs.writeFileSync(STATUSPATH + "/" + snList[i] + "-" + todaysDate + ".txt", curlResults);
	}

}

fs.writeFileSync(REPORTPATH + "/TM-status-" + todaysDate + ".txt", statusesOutput.join(""));