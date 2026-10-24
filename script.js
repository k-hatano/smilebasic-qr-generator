
const LENGTH_PER_PAGE = 512;

function generateQRCodeClicked() {
    let programName = document.getElementById('name').value;
    let source = document.getElementById('source').value.replace(/\n/g, "\r");
    let dataForQRCode = generateDataForQRCode(programName, source);
    
    document.getElementById('result').value = dataForQRCode;
    
    let qrImgTags = '';
    document.getElementById('qr').innerHTML = '';
    for (let i = 0; i < dataForQRCode.length; i++) {
        let qr = qrcode(0, 'H');
        qr.addData(dataForQRCode[i]);
        qr.make();
        qrImgTags += qr.createImgTag(4);
    }
    document.getElementById('qr').innerHTML = qrImgTags;
}

function generateDataForQRCode(programName, utfSource) {
    let result = [];
    let pageCount = 0;

    let sjisSource = Encoding.convert(Encoding.stringToCode(utfSource), {
      to: 'SJIS',
      from: 'UNICODE'
    });
    var source = Encoding.codeToString(sjisSource);

    let petcSource = "PETC0300RPRG";
    petcSource += leBytesForNum(0);
    petcSource += leBytesForNum(0);
    petcSource += leBytesForNum(source.length);
    petcSource += source;
    
    let deflate = new Zlib.Deflate(stringToByteArray(petcSource), {
        compressionType: Zlib.Deflate.CompressionType.DYNAMIC
    });
    let petcSourceRawCompressed = deflate.compress();
    let petcSourceCompressed = bytesToString(petcSourceRawCompressed);

    let rprgSource = stringPaddedNull(programName, 8);
    rprgSource += "RPRG";
    rprgSource += leBytesForNum(petcSourceCompressed.length);
    rprgSource += leBytesForNum(petcSource.length);
    rprgSource += petcSourceCompressed;

    let wholeHash = md5(stringToByteArray(rprgSource));

    pageCount = Math.ceil(rprgSource.length / LENGTH_PER_PAGE);

    for (let i = 0; i < pageCount; i++) {
        let pageRprgSource = rprgSource.substring(i * LENGTH_PER_PAGE, (i + 1) * LENGTH_PER_PAGE);
        let pageHash = md5(stringToByteArray(pageRprgSource));
 
        let partSource = "PT";
        partSource += String.fromCharCode(i + 1);
        partSource += String.fromCharCode(pageCount);
        partSource += md5HashToBytes(wholeHash);
        partSource += md5HashToBytes(pageHash);
        partSource += pageRprgSource;

        result.push(partSource);
    }

    return result;
}

/* Utils */

function stringToByteArray(string) {
    let result = [];
    for (let i = 0; i < string.length; i++) {
        result.push(string.charCodeAt(i) & 0xff);
    }
    return result;
}

function md5HashToBytes(hash) {
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += String.fromCharCode(parseInt(hash.substring(i * 2, i * 2 + 2), 16));
    }
    return result;
}

function bytesToString(bytes) {
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i] & 0xff);
    }
    return result;
}

function stringPaddedNull(str, len) {
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
