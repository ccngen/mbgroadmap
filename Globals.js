const _milestone_file = "1byT1wOse_OpPJ9_2ap34jN0mewzjUfBlaexodFFJu8k";
//const _finance_db = "1P3dusEmn_kdm6IYnqNAWEOJiNhq-YX2a0T6yA5XCK80";
const _finance_db = "1c1pNSIIn69U_jH7VIaeLngy8UFLF_aZ3t3nZlFZZAWI";
const _ltf_db = "1RWAmS1F-mP5QSt3_3xFWYx2UsIjrDuCPeqdsyG4Jsh8";
const _mktfb = "1EHhdXTYtKYLUuQ7xz4urGLJkvVxiQnZb5-ZoI3FDBdc";

const Plist = "Plist";
//const Kparts = "Kparts";
const Comps = "Comps";
const UserList = "userList";
const milestn = "milestones";
const ltfdb = "ConsolidatedDB";
const findb = "BC Finance Database";
const bcdb = "PCON & ROI by Geo (ECWV)";
const bcdbOfPOR = "PCON & ROI by Geo (POR)";
const _pics_folder = "1eb_rZ7zGanIj-V6-wJaeZYdor9bu2Z9D";
const editSpecsSyncUpdateList = ['Chipset', 'Memory', 'Charger', 'Battery', 'Display', 'Cam#1', 'Cam#2', 'Cam#3', 'Cam#4', 'FCam', 'FPS'];

const _PNAME = 0;
const _GEO = 3;
const _Y = 5;
const _RPP = 6;
const _OK2S = 7;
const _SCHDname = 13;
const _LTFstart = 15;
const _LTFstop = 22;
const _CWVstart = 23; // first col is 0
const _CWVstop = 30;
const _DETAILS_start = "A";
const _DETAILS_stop = "I";
const _THUMBN = "J";
const _SPCS_start = "AF";
const _SPCS_stop = "CD";
const _STATUS_start = "CJ";
const _STATUS_stop = "CM";
const _LTF_range = "P2:W";
const _NETWORK = "CN";
const _CNAME = "I";
const specsAppendIndex = ['CV', 'CX'] // Android,OD,Handbook
const editSpecsAdditional = ['CZ', 'DD']
const extraSpecsAdditional = ['DE', 'DJ']
const SW_DEV = 'CY'

var ws;
var data;
var cmdata;

const ACL = getUserList();

function getUserList() {
    const users = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(UserList);
    const data = users.getDataRange().getValues();
    const userMap = {}
    data.forEach((user, index) => {
        if(index > 0) {
            userMap[user[0]] = [user[1], user.slice(2).join('')]
        }
    })
    return userMap
}

// bit0: RMTools access
// bit1: Schedules
// bit2: ID
// bit3: Specs
// bit4: BC
// bit5: TMC (and status)
// bit6: TMC Edit
// bit7: TMC Export, Create/Edit/Delete Product

