function addNewUser1 (email, nickname, permission) {
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();
    const el = data.find(el => el[0] == email);
    if(el) return {code: false, message: 'User exists'}

    userList.appendRow([email, nickname, ...permission.split('')])
    return {code: true}
}

function updateUserPermission(list) {
    const sheetIndex = ['A', 'I']
    list = JSON.parse(list)
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();
    list.forEach(user => {
        let index = data.findIndex(item => item[0] === user[0])
        if(index > 0) {
            index += 1
            userList.getRange(sheetIndex[0] + index + ":" + sheetIndex[1] + index).setValues([user]);
        }
    })
    return {code: true, message: 'Update OK'}
}

function deleteUser(emailList) {
    emailList = JSON.parse(emailList)
    const userList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const rng = userList.getDataRange();
    const data = rng.getValues();

    const indexs = []
    data.forEach((item, index) => {
        if (emailList.includes(item[0])) {
            indexs.push(index + 1)
        }
    })
    // 必须从最后往前删除
    indexs.sort((a, b) => b - a).forEach(index => {
        userList.deleteRow(index)
    })
    return {code: true, message: 'Delete OK'}
}

function doGet(e) {
    var params = e.parameter;
    if (params.rmt != null) {
        if (checkAccess()) return HtmlService.createTemplateFromFile('rmv').evaluate().setTitle("MBG Roadmap");
        else return HtmlService.createTemplateFromFile('noaccess').evaluate();
    }
}


function checkAccess() {
    var usr = Session.getActiveUser().getEmail();
    if (usr in ACL) {
        const rightStr = ACL[usr][1]
        return rightStr.split('')[0] & 1
    }
    return false;
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
    else version.rights = '00000000';

    return version;
}

// test current user rights for given level
function testACL(level) {
    var usr = Session.getActiveUser().getEmail();
    if (usr in ACL) return (((ACL[usr][1] >> level) & 1) == 1);
    else return false;
}

function outputMessage() {
    var usr = Session.getActiveUser().getEmail();
    if (usr in ACL) {
        const rightStr = ACL[usr][1]
        return {
            email: usr,
            data: rightStr.split('')[0] & 1
        }
    }
    return { email: usr }
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

// arr=data from AF to CD, cmt=notes from AF to CD otherArr is width - Android
// additionalArr 2023-V03-拆分Non-DM  CZ - DD
function saveProductSpecs(pname, arr, cmt, specsNewLabel, additionalArr, additionalCmt, extraArr, extraCmt ) {
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

    plist.getRange(editSpecsAdditional[0] + idx + ":" + editSpecsAdditional[1] + idx).setValues([JSON.parse(additionalArr)]);
    plist.getRange(editSpecsAdditional[0] + idx + ":" + editSpecsAdditional[1] + idx).setNotes([JSON.parse(additionalCmt)]);

    plist.getRange(extraSpecsAdditional[0] + idx + ":" + extraSpecsAdditional[1] + idx).setValues([JSON.parse(extraArr)]);
    plist.getRange(extraSpecsAdditional[0] + idx + ":" + extraSpecsAdditional[1] + idx).setNotes([JSON.parse(extraCmt)]);

    specsNewLabel = JSON.parse(specsNewLabel)

    // rowI 为对应在sheet中的列数， i为当前数组的索引值
    specsNewLabel.forEach((item, i) => {
      const rowI = item.index
      plist.getRange(rowI+(idx)).setValue(item.cellValue);
      if(item.cmt) {
        plist.getRange(rowI+(idx)).setNote(item.cmtValue);
      }
    })
    
    return true;
}
/**
 * 设置产品某单个数据
 * pname 产品名 list = [{index, value}] value 值 index位置
 * */
function setProductOneData(pname, list = []) {
    var rng = plist.getDataRange();
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME] == pname);
    list.forEach(({ value, index }) => {
        var cell = plist.getRange(index+(idx + 1));
        cell.setValue(value);
    })
}

function updateProductDetails(olpname, pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Network, Cname, swDev, b2b, b2b_ok2s) {
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
    setProductOneData(pname,[
        { index: _NETWORK, value: Network },
        { index: SW_DEV, value: swDev },
        { index: _B2B, value: b2b },
        { index: _B2BOk2s, value: b2b_ok2s },
    ]);

    // re-order Plist
    var rng = plist.getRange(2, 1, plist.getLastRow()-1, plist.getLastColumn());
    rng.sort([{column: _GEO, ascending: false}, {column: _RPP, ascending: true}, {column: _OK2S, ascending: true}]); // by Geo desc, RPP asc, OK2S asc
    return true;
}

function createProduct(pname, Cat, Geo, X, Y, RPP, OK2S, Dev, Network, Cname, swDev,b2b) {
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
    setProductOneData(pname,[
        { index: _NETWORK, value: Network },
        { index: SW_DEV, value: swDev },
        { index: _B2B, value: b2b },
    ]);

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
    sheetDB = SpreadsheetApp.openById(_finance_db)
    const BCDatas = {};
    const typeMap = [
        { key: 'POR', dbName: bcdbOfPOR },
        { key: 'ECWV', dbName: bcdb },
    ]
    typeMap.forEach((typeData) => {
        sheet = sheetDB.getSheetByName(typeData.dbName);
        bcrng = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn());
        bcdata = bcrng.getValues();
        idx = bcdata.findIndex(el => (el[0]==bcname));
        BCDatas[typeData.key] = idx==-1 ? null : bcdata[idx];
    })

    if (!BCDatas['POR'] && !BCDatas['ECWV']) return null;
    return BCDatas;
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
            const componentName = comp[0]
            data[componentName] = data[componentName] || []
            data[componentName].push(comp)
        })
    }
    return JSON.stringify(data)
}

// 获取表数据

function getDataBySheetName(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const rng = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn());
    return {
        sheet,
        rng,
        data: rng.getValues()
    }
}
// 获取components表的数据
function getComponentsData() {
    const comList = getDataBySheetName(Comps).data.slice(1)
    const productList = getDataBySheetName(Plist).data
    const filedArr = productList[0]
    const componentNameArr =  Array.from(new Set(comList.map(com => com[0])))

    const data = {}
    comList.forEach(com => {
        const obj = { specs: com[1], value: com[2], target: com[3], products: [] }

        if(data[com[0]]) { // 去除重复项
            return data[com[0]][com[1]] = obj
        }
        data[com[0]] = { [com[1]]: obj }
    })
    // 为了减少循环次数，循环产品列表，去匹配每个产品的specs描述对得上不
    productList.forEach(product => {
        componentNameArr.forEach(filed => {
            const comData = data[filed]
            const filedIndex = filedArr.findIndex(name => name.toUpperCase().trim().indexOf(filed.toUpperCase().trim()) > -1) // 完全匹配
            if (comData[product[filedIndex]]) {
                comData[product[filedIndex]].products.push(product[0])
            }
        })
    })
    //  转化数据格式
    Object.entries(data).forEach(([key, value]) => {
        data[key] = Object.values(value)
    })
    return JSON.stringify(data)
}

function saveComponentsAndSync(deleteArr = '[]', addArr = '[]', savedArr = '[]') {
    deleteArr = JSON.parse(deleteArr)
    addArr = JSON.parse(addArr)
    savedArr = JSON.parse(savedArr)
    const plistObj = getDataBySheetName(Plist)
    const compsObj = getDataBySheetName(Comps)
    const comList = compsObj.data.slice(1)
    const productList = plistObj.data
    const filedArr = productList[0]

    deleteArr.forEach(comp => {
        const { val } = comp
        let compIndex = comList.findIndex(item => item[0] == val[0] && comp.id === item[1] + '||' + item[2])
        if(compIndex > -1) {
            compsObj.sheet.deleteRow(compIndex + 2)
        }
    })

    savedArr.forEach(comp => {
        const { val, products } = comp
        const filedIndex = filedArr.indexOf(val[0])
        products.forEach(p => {
            const rowIndex = productList.findIndex(item => item[0] === p)
            if(rowIndex > 0) {
                const col = val[0] === 'FCam' ? 'BY' : numberToStr(filedIndex + 1)
                const col1 = val[0] === 'FCam' ? 'BZ' : numberToStr(filedIndex + 2)
                plistObj.sheet.getRange(col+(rowIndex + 1)).setValue(val[1]);
                plistObj.sheet.getRange(col1+(rowIndex + 1)).setValue(val[2]);
            }
        })

        let compIndex = comList.findIndex(item => item[0] == val[0] && comp.id === item[1] + '||' + item[2])
        if(compIndex > -1) {
            compIndex += 2
            compsObj.sheet.getRange('A' + compIndex + ":" + 'D' + compIndex).setValues([val]);
        }
    })

    addArr.forEach(item => {
        compsObj.sheet.appendRow(item.val)
    })
    if(addArr.length > 0) {
        var rng = compsObj.sheet.getRange(2, 1, compsObj.sheet.getLastRow()-1, compsObj.sheet.getLastColumn());
        rng.sort([{column: 1, ascending: true}]);
    }
}

function getActionItems() {
    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(1,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    let list = rng.getValues();
    list.splice(0, 1)
    // 通过时间排序
    const sortList = list.sort((a, b) => {
        const time1 = a[2] ? new Date(a[2]).getTime() : 0
        const time2 = b[2] ? new Date(b[2]).getTime() : 0
        return time2 - time1
    })

    return JSON.stringify(sortList.map(item => {
        const date = item[2] ? getTimeStr(item[2]) : ''
        return {
            id: item[0],
            product: item[1],
            meeting: item[3],
            date: date,
            actionPoints: item[4],
        }
    }))
}


function getActionItemsByPname(pname) {
    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(1,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    let list = rng.getValues();
    list.splice(0, 1)

    list = list.filter(item => item[1] === pname)
    // 通过时间排序
    const sortList = list.sort((a, b) => {
        const time1 = a[2] ? new Date(a[2]).getTime() : 0
        const time2 = b[2] ? new Date(b[2]).getTime() : 0
        return time2 - time1
    })

    return JSON.stringify(sortList.map(item => {
        const date = item[2] ? getTimeStr(item[2]) : ''
        return {
            id: item[0],
            product: item[1],
            meeting: item[3],
            date: date,
            actionPoints: item[4],
        }
    }))
}

function addMeetingSubmit(addArr) {
    addArr = JSON.parse(addArr)
    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(2,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    addArr.forEach(item => {
        AItemsSheet.appendRow(item)
    })
    rng.sort([{column: 4, ascending: true}])
    return getActionItems()
}

function deleteMeeting(deleteArr = '[{ "meeting": "测试111", "date": "2023-03-26" }]') {
    deleteArr = JSON.parse(deleteArr)
    const AItemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AItems);
    const rng = AItemsSheet.getRange(2,1,AItemsSheet.getLastRow(),AItemsSheet.getLastColumn());
    const list = rng.getValues();
    const indexList = [] // 记录下来，然后从最后一行开始往前删除, 避免删除前面的，会影响后面的索引
    deleteArr.forEach((item) => {
        list.forEach((sheetItem, index) => {
            const date = sheetItem[2] ? getTimeStr(sheetItem[2]) : ''
            if(date === item['date'] && sheetItem[3] === item['meeting']) {
                indexList.push(index + 2)
            }
        })
    })
    indexList.sort((a, b) => b - a).forEach(index => {
        AItemsSheet.deleteRow(index)
    })
}

function saveProductDimension(pname , list) {
    const saveIndex = ['CO', 'CU']
    plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    var rng = plist.getRange(1,1,plist.getLastRow(),plist.getLastColumn());
    data = rng.getValues();
    idx = data.findIndex(el => el[_PNAME]==pname);
    //  这里可以找到这次要更新产品的数据，但还未刷新数据
    if (idx==-1) return false;
    // if exists, update specs
    idx++; // so that it refers to range numbers
    plist.getRange(saveIndex[0] + idx + ":" + saveIndex[1] + idx).setValues([JSON.parse(list)]);
    return true;
}

function getProductBCList() {
    const sheetDB = SpreadsheetApp.openById(_finance_db)
    const sheet = sheetDB.getSheetByName(bcdb);
    const bcrng = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn());
    const bcdata = bcrng.getValues();
    return bcdata
}

function overallSearch(startDate, endDate) {
    const productList = JSON.parse(getData())
    const bcList = getProductBCList()
    // 从产品表获取符合时间_RPP列的产品，并获取对应产品的bcname 然后通过bcname(11)比对，获取bc中对应的ECWV
    const _bcnameIndex = 11;
    const filterData = []

    const getTime = (date) => date ? new Date(date).getTime() : 0;
    const startDateTime = getTime(startDate)
    const endDateTime = getTime(endDate)
    productList.forEach((product) => {
        if(product[_RPP]) {
            const rpp = getTime(product[_RPP])
            if((startDateTime > 0 && endDateTime > 0 && endDateTime >= rpp && startDateTime <=rpp)
                || (startDateTime === 0 && endDateTime > 0 && rpp <= endDateTime)
                || (endDateTime === 0 && startDateTime > 0 && rpp >= startDateTime)) {
                const bcData = bcList.find((bcItem) => bcItem[0] === product[_bcnameIndex])
                filterData.push({
                    product: product[0],
                    ok2s: product[_OK2S],
                    ca: bcData ? (bcData[11] == "" || bcData[11] == 0) ? "" : (bcData[11] / 1000) : ''
                })
            }
        }
    })
    return JSON.stringify(filterData);
}


function searchOfByComponent(startDate, endDate, componentName = 'Charger') {
    const plist = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Plist);
    const rng = plist.getRange(1,1,1,plist.getLastColumn());
    const firstLineOfTitle = rng.getValues()[0]
    const searchListOfDate = JSON.parse(overallSearch(startDate, endDate)) // 筛选了时间
    const componentIndex = firstLineOfTitle.indexOf(componentName)
    const list = searchListOfDate.map(item => {
        return {
            specs: item.sourceData[componentIndex],
            product: item.product,
            caTotal: item.caTotal
        }
    })
    return JSON.stringify(list)
}