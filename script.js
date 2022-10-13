
function generateQRCodeClicked() {
    let programName = document.getElementById('name').value;
    let source = document.getElementById('source').value.replace(/\n/g, "\r");
    let dataForQRCode = generateDataForQRCode(programName, source);
    
    document.getElementById('result').value = dataForQRCode;
    
    let qr = qrcode(0, 'H');
    qr.addData(dataForQRCode);
    qr.make();
    document.getElementById('qr').innerHTML = qr.createImgTag(4);
}

function generateDataForQRCode(programName, source) {
    console.log("source : " + source);
    let petcSource = "PETC0300RPRG";
    petcSource += leBytesForNum(0);
    petcSource += leBytesForNum(0);
    petcSource += leBytesForNum(source.length);
    petcSource += source;
    console.log("petcSource : " + petcSource);
    console.log("petcSource.length : " + petcSource.length);
    console.log("petcSource$ : " + stringToUnicodeEscapedStringLiteral(petcSource));
    
    let deflate = new Zlib.Deflate(stringToByteArray(petcSource), {compressionType: Zlib.Deflate.CompressionType.DYNAMIC});
    let petcSourceRawCompressed = deflate.compress();
    console.log("petcSourceRawCompressed : " + petcSourceRawCompressed);
    let petcSourceCompressed = bytesToRawString(petcSourceRawCompressed);
    console.log("petcSourceCompressed : " + petcSourceCompressed);
    console.log("petcSourceCompressed.length : " + petcSourceCompressed.length);
    console.log("petcSourceCompressed$ : " + stringToUnicodeEscapedStringLiteral(petcSourceCompressed));

    let rprgSource = stringPaddingNull(programName, 8);
    rprgSource += "RPRG";
    rprgSource += leBytesForNum(petcSourceCompressed.length);
    rprgSource += leBytesForNum(petcSource.length);
    rprgSource += petcSourceCompressed;
    console.log("rprgSource : " + rprgSource);
    console.log("rprgSource.length : " + rprgSource.length);

    let hash = md5(stringToByteArray(rprgSource));
    console.dir(hash);

    let partSource = "PT";
    partSource += String.fromCharCode(0x01);
    partSource += String.fromCharCode(0x01);
    partSource += bytesFromMD5Hash(hash);
    partSource += bytesFromMD5Hash(hash);
    partSource += rprgSource;
    console.log("rprgSource$ : " + stringToUnicodeEscapedStringLiteral(rprgSource));
    console.log("partSource$ : " + stringToUnicodeEscapedStringLiteral(partSource));
    console.log("partSource.length : " + partSource.length);

    return partSource.substring(0, 630);
}

/* Utils */

function stringToUnicodeEscapedStringLiteral(string) {
    let result = "";
    for (let i = 0; i < string.length; i++) {
        result += "\\x" + ("00" + string.charCodeAt(i).toString(16)).slice(-2);
    } 
    return result;
}

function stringToByteArray(string) {
    let result = [];
    for (let i = 0; i < string.length; i++) {
        result.push(string.charCodeAt(i) & 0xff);
    }
    return result;
}

function bytesFromMD5Hash(hash) {
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += String.fromCharCode(parseInt(hash.substring(i * 2, i * 2 + 2), 16));
    }
    return result;
}

function bytesToRawString(bytes) {
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i] & 0xff);
    }
    return result;
}

function stringPaddingNull(str, len) {
    let result = str;
    while (result.length < len) {
        result += "\0";
    }
    return result;
}

function leBytesForNum(num) {
    return String.fromCharCode(num & 0xFF, 
        (num >> 8) & 0xFF, 
        (num >> 16) & 0xFF, 
        (num >> 24) & 0xFF);
}
