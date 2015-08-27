README

Bare-bones trademark monitoring system. USPTO only.

Two scripts are included in this project:

1. tm-status.js.
	Given a list of US TM serial numbers to watch, spits out a
	one-line status for each SN into a "Statuses" directory. A
	report with today’s date is placed in “Status-Reports” with
	the name “TM-sttaus-<date>.txt”.

2. tm-monitor.js. 
	Given a list of query strings in “monitor-queries”, searches
	the latest TMOG (Trademark On-Line Gazette) to see if any
	new applications have popped up. The output is placed into a
	directory called "TMOG-Reports," with output from each TMOG
	placed in a file named "TMOG-<date>-results".

A sample sn-list and monitor-queries file is included.

I suggest running this with Cron and potentially using
Dropbox, IFTTT, osx textutil, etc. to send the results to
yourself via email every week. Node v.0.11 or higher is
required for the execSync methods.

Michael Saji saji@saji.org August 26, 2015
