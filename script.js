
let qrcode = new QRCode(document.getElementById('qr'));

function generateQRCode() {
    let source = document.getElementById('source').value;
    let deflate = new Zlib.Deflate(source);
    let sourceCompressed = new String(deflate.compress());

    document.getElementById('result').value = sourceCompressed;
    
    qrcode.clear();
    qrcode.makeCode(sourceCompressed);
}
