// // source: https://github.com/thlorenz/dev-null
// var util         = require('util')
//   , stream       = require('stream')
//   , Writable     = stream.Writable
//   , setImmediate = setImmediate || function (fn) { setTimeout(fn, 0) }
  
// util.inherits(DevNull, Writable)
// function DevNull (opts) {
//   if (!(this instanceof DevNull)) return new DevNull(opts)
//   opts = opts || {}
//   Writable.call(this, opts)
// }
// DevNull.prototype._write = function (chunk, encoding, cb) {
//   setImmediate(cb)
// }
// // -- DevNull End --

const http = require('http')
const server = http.createServer()
const fs = require('fs')
const path = require('path')

server.on('request', async (req, res) => {
  console.log('{SERVER} Incoming request', req.url, new Date())
  try {
    req.socket.on('end', function () {
      console.log('{SERVER} SOCKET END: other end of the socket sends a FIN packet')
    })
    req.socket.on('timeout', function () {
      console.log('{SERVER} SOCKET TIMEOUT')
    })
    req.socket.on('error', function (error) {
      console.log('{SERVER} SOCKET ERROR: ' + JSON.stringify(error))
    })
    req.socket.on('close', function (had_error) {
      console.log('{SERVER} SOCKET CLOSED. IT WAS ERROR: ' + had_error)
    })

    // Write to /dev/null instead
    // const writeStream = DevNull()
    const writeStream = fs.createWriteStream(path.join(__dirname, 'temp-upload'))

    const promise = new Promise((resolve, reject) => {
      req.on('end', resolve)
      req.on('error', reject)
    })

    req.pipe(writeStream)
    await promise

    res.end('OK')
    console.log('{SERVER} Request ended', req.url, new Date())
  } catch (err) {
    res.writeHead(500)
    res.end(err.message)
  }
})

// NOTE: enable this on node 12.19.0 and the client request will run successfully
// server.on('timeout', () => {
//   console.log('{SERVER} timeout')
// })

console.log(`Running on node ${process.version}`)

server.listen(8081).on('listening', () => { console.log('{SERVER} Listening on port', server.address().port) })