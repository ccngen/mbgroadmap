// On open set menus
function onOpen2(e) {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('RMDB')
        .addItem('Update Roadmap', 'updateList')
        .addToUi();
}

// update Plist with thumbnails, CWV, LTF, status
function updateList() {
    // Sort Plist
    ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = ws.getRange(2, 1, ws.getLastRow()-1, ws.getLastColumn());
    rng.sort([{column: _GEO, ascending: false}, {column: _RPP, ascending: true}, {column: _OK2S, ascending: true}]); // by Geo desc, RPP asc, OK2S asc

    // Get Plist data
    var rng = ws.getRange(1,1,ws.getLastRow(),ws.getLastColumn());
    data = rng.getValues();
    cmdata = rng.getNotes();

    // Update Thumbnails
    //importThumbnails();

    // import LTF
    importLTF();

    // import CWV
    importCWV();

    // import Status Data
    importStatus();

    Logger.log("Plist updated");
}


// find the thumbnails ID for each project
function importThumbnails() {
    t0 = new Date().getTime();

    var ids = [];

    // get the list of projects
    prj_list = data.map(x => x[0]);
    prj_list.shift();

    // find the thumbnail ID for each project name
    for ([i, pname] of prj_list.entries()) {
        files = DriveApp.getFilesByName(pname + "_RenderSmall.png");
        if (files.hasNext()) ids.push([files.next().getId()]);
        else ids.push([""]);
    }
    ws.getRange(_THUMBN + "2:" + _THUMBN).setValues(ids);

    t1 = new Date().getTime();
    Logger.log(arguments.callee.name + ": " + (t1-t0));
}


// import LTF
function importLTF() {
    var ltfws = SpreadsheetApp.openById(_ltf_db).getSheetByName(ltfdb);
    var ltfrg = ltfws.getRange(1, 1, ltfws.getLastRow()-1, ltfws.getLastColumn());
    var ltfdt = ltfrg.getValues();

    // find the LTF numbers of pname on the list of quarters listOfQ
    findLTF = function(pname, listOfQ) {
        // find index
        pidx = ltfdt.findIndex(x => x[0]==pname);
        // if can't find return empty array
        if (pidx==-1) return new Array(8);
        // otherwise look for the various fields
        var res = [];
        for (lb of listOfQ) {
            // find label index in db
            lidx = ltfdt[0].findIndex(x => x==lb);
            // if found label return LTF value otherwise return empty
            if (lidx!=-1) res.push(ltfdt[pidx][lidx]);
            else res.push("");
        }
        return res;
    }

    t0 = new Date().getTime();
    // get the list of projects
    prj_list = data.map((x, i) => x[0]);
    prj_list.shift();
    // get list of quarters labels
    qtr_list = data[0].slice(_LTFstart, _LTFstop+1);
    // for each project get the LTF numbers for the given quarters
    var ret = [];
    for (prj_name of prj_list)
        ret.push(findLTF(prj_name, qtr_list));
    // write results in plist
    ws.getRange(_LTF_range).setValues(ret);
    t1 = new Date().getTime();
    Logger.log(arguments.callee.name + ": " + (t1-t0));
}


// import eCWV CA from BC database to Plist
function importCWV() {
    getVol = function(input, prod, quarter, NA) {
        // filter out other products, quarters, geos than looked for
        var res = input.filter(x => (x[0]==prod) && (x[3]==quarter) && ((NA && x[1]=="NA") || (!NA && x[1]!="NA")));
        // keep only the volumes and sum them
        var vol = res.reduce((total, curr) => total + curr[4], 0)
        return vol;
    }

    t0 = new Date().getTime();
    // get CA data from BC Dashboard
    var bc = SpreadsheetApp.openById(_finance_db).getSheetByName(findb);
    var res0 = bc.getRange("B2:N").getValues();

    // filter out non ECVW lines
    var res1 = res0.filter(el => el[11]=="ECWV");

    // matrix of data to write
    var vals = [];

    // for each line of Plist
    for (i=1; i<data.length; i++) {
        bcname = data[i][11];
        if (bcname=="") valsline = new Array(_CWVstop-_CWVstart+1);
        else {
            var valsline = [];
            for (j=_CWVstart; j<=_CWVstop; j++) {
                valitem = getVol(res1, bcname, data[0][j].substring(4), data[i][2]=="NA") / 1000;
                valsline.push(valitem);
            }
        }
        vals.push(valsline);
    }

    // write in Plist
    ws.getRange(2, _CWVstart+1, ws.getLastRow()-1, _CWVstop-_CWVstart+1).setValues(vals);
    t1 = new Date().getTime();
    Logger.log(arguments.callee.name + ": " + (t1-t0));
}


// import status from milestone dashboard
function importStatus() {
    t0 = new Date().getTime();

    // load milestones data
    ws2 = SpreadsheetApp.openById(_milestone_file);
    rng2 = ws2.getRange("milestones!A:W");
    data2 = rng2.getValues();
    notes2 = rng2.getNotes();
    colors2 = rng2.getBackgrounds();
    milst = ws2.getRange("milestones!G12:W12").getValues();

    // for each product of Plist
    var res = data.map((row, idx) => {
        line = [];

        // headers
        if (idx == 0)  return ["Milestone", "Status", "Severity", "CWVOK2S"];

        // find the key
        if (row[_SCHDname]!="") key = row[_SCHDname]; else key = row[_PNAME];
        sel = null;
        for ([idx,el] of data2.entries()) {
            if ((el[0]==key) && (el[1]=="CWV")) {
                sel = el;
                selidx = idx;
                break;
            };
        }

        // find milestone, notes and severity color
        if (sel) {
            levl = milst[0].indexOf(sel[2]);
            line.push(levl);
            line.push(notes2[selidx][5]);
            line.push(colors2[selidx][5]);
            line.push(data2[selidx][22]);
        } else line.push(-1, "", "", "");
        return line;
    });

    // save to Plist
    ws.getRange("Plist!" + _STATUS_start + ":" + _STATUS_stop).setValues(res);
    t1 = new Date().getTime();
    Logger.log(arguments.callee.name + ": " + (t1-t0));
}

// 只处理至多两位 'AF' => 32
function getSheetIndex(str) {
    if(str.length === 1) {
        return (str.charCodeAt() - 65)
    }
    const arr = str.split('')
    // 因为数组从零开始 所以最后减一
    return (arr[0].charCodeAt() - 64) * 26 + (arr[1].charCodeAt() - 64) - 1
}

// num 从1开始 32 => 'AF'
function numberToStr(num) {
    if(num <= 26) {
        return String.fromCharCode(num + 64)
    }
    const numTimes =  Math.floor(num / 26)
    return `${numberToStr(numTimes)}${numberToStr(num - numTimes * 26)}`
}

function getTime(timestr) {
    if (!timestr) return 0
    const time = new Date(timestr)
    return new Date(`${time.getFullYear()}-${time.getMonth() + 1}`)
}




