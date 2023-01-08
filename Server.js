function addNewUser1 (email, nickname, permission) {
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();
    const el = data.find(el => el[0] == email);
    if(el) return {code: false, message: 'User exists'}

    userList.appendRow([email, nickname, `0b${permission}`])
    return {code: true}
}

function updateUserPermission(email, permission) {
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();
    const idx = data.findIndex(el => el[0] == email);

    if (idx==-1) return {code: false, message: 'No user found'};
    const setRange = userList.getRange("C"+(idx+1))
    setRange.setValue('0b'+permission)
    return {code: true, message: 'Edit OK'}
}

function deleteUser(email) {
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();
    const idx = data.findIndex(el => el[0] == email);

    if (idx==-1) return {code: false, message: 'No user found'};
    userList.deleteRow(idx + 1)
    return {code: true, message: 'Delete OK'}
}

function doGet(e) {
    var params = e.parameter;
    if (params.rmt != null) {
        if (testACL(0)) return HtmlService.createTemplateFromFile('rmv').evaluate().setTitle("MBG Roadmap");
        else return HtmlService.createTemplateFromFile('noaccess').evaluate();
    }
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getData() {
    ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = ws.getRange(1,1,ws.getLastRow(),ws.getLastColumn());
    data = rng.getValues();
//  ws2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Kparts);
//  var rng2 = ws2.getRange(1,1,ws2.getLastRow(),ws2.getLastColumn());
//  data2 = rng2.getValues();

    // adding RF information
//  dataex = data.map(el => {
//    idx = data2.findIndex(chp => chp[0]==el[58]);
//    if (idx>-1) rf = data2[idx][3];
//    else rf = "";
//    el.push(rf);
//  });
    return JSON.stringify(data);
}

function getVersion() {
    var version = {};
    version.whatsnew = "";
    // version.whatsnew = "- Added Default Color when Create or Edit Project";
    //version.whatsnew = "- Change in premium price-bands<br>- Added RealMe roadmap view";
    //version.whatsnew = "- Added Family in contextual bubble<br>- Added Competition roadmap views<br>- Added Market Feedback by price segment (click on each RPP)";
    //version.whatsnew = "- Show chipset in Dev view<br>- Show dev in Status view<br>- Rescaled fonts when more quarters displayed";
    //version.whatsnew = "- Changed main interface to classic roadmap view";
    //version.whatsnew = "- Added the possibility to add, delete, edit projects<br>- Updated TMC targets per segment";
    //version.whatsnew = "- Create Projects from MBG Roadmap<br>- Edit TMC details from MBG Roadmap<br>- Rear Cameras breakdown<br>- Structured Display description<br>- UI Updates<br>- Bug fixes";
    //version.whatsnew = "- Uses RMDB as backoffice instead of RMT";
    //version.whatsnew = "- Added link to Business Case file<br>- Added Comments View";
    //version.whatsnew = "- Japan Integration<br>- Variable number of price columns<br>- Links to Product Decks";
    version.number = 74; // date: 2022-5-24 8:39PM

    // rights
    var usr = Session.getActiveUser().getEmail();
    if (usr in ACL) version.rights = ACL[usr][1];
    else version.rights = 0b00000000;

    return version;
}

// test current user rights for given level
function testACL(level) {
    var usr = Session.getActiveUser().getEmail();
    if (usr in ACL) return (((ACL[usr][1] >> level) & 1) == 1);
    else return false;
}

function getProduct(pname) {
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==pname);
    if (idx==-1) return null;
    prod = JSON.stringify(data[idx]);
    data = rng.getNotes();
    note = JSON.stringify(data[idx]);
    var ret = {};
    ret.prod = prod;
    ret.note = note;
    return ret;
}

function saveProductSpecs(pname, arr, cmt, otherArr) { // arr=data from AF to CD, cmt=notes from AF to CD otherArr is width - Android
    // check if product already exists
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==pname);
    //  这里可以找到这次要更新产品的数据，但还未刷新数据
    if (idx==-1) return false;
    const originalData = data[idx]
    // if exists, update specs
    idx++; // so that it refers to range numbers
    plist.getRange(_SPCS_start + idx + ":" + _SPCS_stop + idx).setValues([JSON.parse(arr)]);
    // plist.getRange(_SPCS_start + idx + ":" + _SPCS_stop + idx).setValues([arr]);
    plist.getRange(_SPCS_start + idx + ":" + _SPCS_stop + idx).setNotes([JSON.parse(cmt)]);
    // plist.getRange(_SPCS_start + idx + ":" + _SPCS_stop + idx).setNotes([cmt]);
    plist.getRange(appendSpecsLabelsIndex[0] + idx + ":" + appendSpecsLabelsIndex[1] + idx).setValues([JSON.parse(otherArr)]);
    syncUpdateSameSpecsData(data, originalData, JSON.parse(arr))
    // syncUpdateSameSpecsData(data, originalData, arr)
    return true;
}

function syncUpdateSameSpecsData(plistData, originalData, arr) {
    const sheetFiledList = plistData[0]
    const dataFiledList = JSON.parse(JSON.stringify(plistData[0])).splice(getSheetIndex(_SPCS_start), arr.length) // 提交数据arr对应的列字段列表
    // 1. 对整个产品列表进行循环
    plistData.forEach((productItem, rowIndex) => {
        // 2. 对需要进行刷新的字段列表进行循环， 对每一个产品的对应字段的描述进行对比， 如果一样则setValue
        editSpecsSyncUpdateList.forEach((filed, compIndex) => {
            const filedSheetIndex = sheetFiledList.indexOf(filed) // 在sheet的位置
            const filedDataIndex = dataFiledList.indexOf(filed) // 在提交数据的位置
            if (productItem[filedSheetIndex] === originalData[filedSheetIndex] && productItem[filedSheetIndex]) {
                //const col = numberToStr(filedSheetIndex + 1)
                //const col1 = numberToStr(filedSheetIndex + 2)
                const col = filed === 'FCam' ? 'BY' : numberToStr(filedSheetIndex + 1)
                const col1 = filed === 'FCam' ? 'BZ' : numberToStr(filedSheetIndex + 2)
                plist.getRange(col+(rowIndex + 1)).setValue(arr[filedDataIndex]);
                plist.getRange(col1+(rowIndex + 1)).setValue(arr[filedDataIndex + 1]);
            }
        })
    })

    editSpecsSyncUpdateList.forEach((filed) => {
        const filedSheetIndex = sheetFiledList.indexOf(filed) // 在sheet的位置
        const filedDataIndex = dataFiledList.indexOf(filed) // 在提交数据的位置
        syncCompsSheetData(filed, originalData[filedSheetIndex], [filed, arr[filedDataIndex], arr[filedDataIndex + 1]])
    })
}

function syncCompsSheetData(componentName, originalSpecs, newData) {
    const compsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Comps);
    const rng = compsSheet.getRange(1,1,compsSheet.getLastRow(),compsSheet.getLastColumn());
    const compsData = rng.getValues();
    const rowIndex = compsData.findIndex(comp => comp[0] === componentName && comp[1] === originalSpecs)

    if(rowIndex > -1) {
        compsSheet.getRange('A'+(rowIndex + 1) + ':' + 'C'+(rowIndex + 1)).setValues([newData])
    }
}

function setProductNetWork(pname, Network) {
    var rng = plist.getDataRange();
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME] == pname);

    var cell = plist.getRange(_NETWORK+(idx + 1));
    cell.setValue(Network);
}

function updateProductDetails(olpname, pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Network, Cname) {
    // check if product already exists
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==olpname);
    if (idx==-1) return false;

    // if exists, update details
    idx++; // so that it refers to range numbers
    line = [pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Cname];
    plist.getRange(_DETAILS_start + idx + ":" + _DETAILS_stop + idx).setValues([line]);
    setProductNetWork(pname, Network);

    // re-order Plist
    var rng = plist.getRange(2, 1, plist.getLastRow()-1, plist.getLastColumn());
    rng.sort([{column: _GEO, ascending: false}, {column: _RPP, ascending: true}, {column: _OK2S, ascending: true}]); // by Geo desc, RPP asc, OK2S asc
    return true;
}

function createProduct(pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Network, Cname) {
    if (pname=="") return false;
    // check if product already exists
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==pname);
    if (idx!=-1) return false;

    // if not create the product
    plist.insertRowBefore(2);
    line = [pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Cname];
    plist.getRange(_DETAILS_start + "2:" + _DETAILS_stop + "2").setValues([line]);
    setProductNetWork(pname, Network);

    // re-order Plist
    var rng = plist.getRange(2, 1, plist.getLastRow()-1, plist.getLastColumn());
    rng.sort([{column: _GEO, ascending: false}, {column: _RPP, ascending: true}, {column: _OK2S, ascending: true}]); // by Geo desc, RPP asc, OK2S asc
    return true;
}

function deleteProduct(pname) {
    // check if product already exists
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==pname);
    if (idx==-1) return false;

    // if exists, delete
    plist.deleteRow(idx+1);
    return true;
}

function getProductSchedule(scname) {
    sheet = SpreadsheetApp.openById(_milestone_file).getSheetByName(milestn);
    scrng = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn());
    scdata = scrng.getValues();
    scnote = scrng.getNotes();
    idx = scdata.findIndex(el => (el[0]==scname && el[1]=="Plan"));
    if (idx==-1) return null;
    resdata = [scdata[0], scdata[11], scdata[idx], scdata[idx+1], scnote[idx+1]];
    return JSON.stringify(resdata);
}

function getProductBC(bcname) {
    sheet = SpreadsheetApp.openById(_finance_db).getSheetByName(bcdb);
    bcrng = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn());
    bcdata = bcrng.getValues();
    idx = bcdata.findIndex(el => (el[0]==bcname));
    if (idx==-1) return null;
    resdata = bcdata[idx];
    return resdata;
}

function getDesign(pname) {
    var e={};
    // product name
    e.pName = pname;
    // CMF
    var ext = "_CMF.png";
    var files = DriveApp.searchFiles('title = "' + e.pName + ext + '"');
    if (files.hasNext()) {
        var file = files.next();
        var imgId = file.getId();
        e.cmfURL="https://drive.google.com/a/motorola.com/uc?export=view&id="+imgId;
    } else e.cmfURL = "";
    // BTY
    var ext = "_Render.png";
    var files = DriveApp.searchFiles('title = "' + e.pName + ext + '"');
    if (files.hasNext()) {
        var file = files.next();
        var imgId = file.getId();
        e.btyURL="https://drive.google.com/a/motorola.com/uc?export=view&id="+imgId;
    } else e.btyURL = "";
    // Colors
    var ext = "_Colors.png";
    var files = DriveApp.searchFiles('title = "' + e.pName + ext + '"');
    if (files.hasNext()) {
        var file = files.next();
        var imgId = file.getId();
        e.colURL="https://drive.google.com/a/motorola.com/uc?export=view&id="+imgId;
    } else e.colURL = "";
    return e;
}

function findThumbnail2(pname) {
    let ret = "";
    let files = DriveApp.getFilesByName(pname + "_RenderSmall.png");
    if (files.hasNext()) {
        let fid = files.next();
        var bytes = fid.getBlob().getBytes();
        ret = Utilities.base64Encode(bytes);
    }
    return ret;
}

function getMktFeedback(rpp) {
    sheet = SpreadsheetApp.openById(_mktfb).getSheetByName("Sheet1");
    scrng = sheet.getRange(1, 1, sheet.getLastRow(), 2);
    scdata = scrng.getValues();
    idx = scdata.findIndex(el => el[0]==rpp);
    if (idx==-1) return null;
    return scdata[idx][1];
}

function getCompsData() {
    const compsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Comps);
    const rng = compsSheet.getRange(2,1,compsSheet.getLastRow(),compsSheet.getLastColumn());
    const compsData = rng.getValues();
    const data = {}
    if (compsData.length > 0) {
        compsData.forEach(comp => {
            const [ componentName, specs] = comp
            if(editSpecsSyncUpdateList.includes(componentName) && specs) {
                data[componentName] = data[componentName] || []
                data[componentName].push(comp)
            }
        })
    }
    return JSON.stringify(data)
}

function updateCompsSheet() {
    const pList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    const compsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Comps);
    const rng = pList.getDataRange();
    const data = rng.getValues();

    const [fieldList, ...products] = data
    const existsMap = {} // 存储已保存的描述，防止重复添加

    editSpecsSyncUpdateList.forEach(item => {
        const index = fieldList.indexOf(item)
        existsMap[item] = []
        if(index > -1) {
            products.forEach(product => {
                const specs = product[index]
                const cost = product[index+1]
                if(!existsMap[item].includes(specs)) {
                    compsSheet.appendRow([item, specs, cost])
                    existsMap[item].push(specs)
                }
            })
        }
    })
}

function getActionItems(pname) {
    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(1,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    const list = rng.getValues();
    pname = 'Bangkok5G_23'

    let filterList = list.filter(item => item[1] === pname)
    // 通过时间排序
    filterList = filterList.sort((a, b) => {
        const time1 = a[2] ? new Date(a[2]).getTime() : 0
        const time2 = b[2] ? new Date(b[2]).getTime() : 0
        return time2 - time1
    })

    return JSON.stringify(filterList.map(item => {
        const date = item[2] ? getTimeStr(item[2]) : ''
        return {
            id: item[0],
            date: date,
            actionPoints: item[3],
            status: item[4],
        }
    }))
}

function saveActionItemsEdit(pname, deleteIdArr = '[]', addArr = '[]', savedArr = '[]') {
    deleteIdArr = JSON.parse(deleteIdArr)
    addArr = JSON.parse(addArr)
    savedArr = JSON.parse(savedArr)

    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(1,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    const list = rng.getValues();

    deleteIdArr.forEach(id => {
        const index = list.findIndex(item => item[0] == id && item[1] === pname)
        if(index > 0) {
            AItemsSheet.deleteRow(index + 1)
        }
    })

    addArr.forEach(item => {
        AItemsSheet.appendRow(item)
    })

    savedArr.forEach(item => {
        let index = list.findIndex(item1 => item1[0] === item[0] && item1[1] === item[1])
        if(index > 0) {
            index++
            AItemsSheet.getRange('A' + index + ":" + 'E' + index).setValues([item]);
        }
    })
}


