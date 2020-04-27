const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const {chmod} = require('@actions/io/lib/io-util');
const path = require('path');
const fs = require('fs');



async function main() {
  try { 

    // download & install covercmp
    let cmpPath
    let toName
    switch (process.platform) {
      case 'linux':
        cmpPath = await tc.downloadTool('https://github.com/arithran/covercmp/releases/download/v1.0.0/covercmp-linux')
        toName = 'covercmp'
        break
      case 'darwin':
        cmpPath = await tc.downloadTool('https://github.com/arithran/covercmp/releases/download/v1.0.0/covercmp-darwin')
        toName = 'covercmp'
        break
      case 'win32':
        cmpPath = await tc.downloadTool('https://github.com/arithran/covercmp/releases/download/v1.0.0/covercmp-windows')
        toName = 'covercmp.exe'
        break
      default:
        throw new Error(`Error: process.platform was ${process.platform}, not one of win32, darwin, linux`)
    }
    const upPath = path.basename(cmpPath)
    const newpath = path.join(upPath, toName)
    await io.mv(cmpPath, newpath)
    if (process.platform !== "win32") {
      await chmod(newpath, 0o755)
    }
    core.addPath(upPath)


    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
    // const gh = JSON.stringify(github.base_ref, undefined, 2)
    // console.log(`The event base_ref: ${gh}`);

    // run 
    // const afterOpts = {};
    // afterOpts.outStream = fs.createWriteStream('after.txt');
    let myOutput = '';
    let myError = '';
    const options = {};
    options.listeners = {
      stdout: (data) => {
        myOutput += data.toString();
      },
      stderr: (data) => {
        myError += data.toString();
      }
    };
    await exec.exec(`go`, [`test -count=1 -cover ./...`], options);
    console.log(`out: ${myOutput}, err ${myError}`);

    // const beforeOpts = {};
    // beforeOpts.outStream = fs.createWriteStream('before.txt');
    // await exec.exec(`go` [`test -count=1 -cover`], beforeOpts);

    await exec.exec(`covercmp go before.txt after.txt`);
    await exec.exec(`ls -la`);

  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

main()
