const crypto = require('crypto')
const http = require('http')
const stream = require('stream')
const util = require('util')
const Readable = stream.Readable

function RandomStream(length, options, timeout) {
  // init Readable
  Readable.call(this, options)
  // save the length to generate
  this.lenToGenerate = length
  this.timer = null
  this.start = null
  this.timeout = timeout
}
util.inherits(RandomStream, Readable)
RandomStream.prototype._read = function (size) {
  if (this.timer) {
    return
  }
  
  if (!this.start) {
    this.start = Date.now()
  }

  const secondsSinceStart = `${(Date.now() - this.start) / 1000}s`
  console.log(`{CLIENT} [read] ${secondsSinceStart}, size of read ${size}, left ${this.lenToGenerate}`)

  this.timer = setTimeout(() => {
    if (!size) {
      size = 1024 // default size
    }
  
    if (size > this.lenToGenerate) { // only this left
      size = this.lenToGenerate
    }

    if (size) {
      this.push(crypto.randomBytes(size))
      this.lenToGenerate -= size
    }

    // when done, push null and exit loop
    if (!this.lenToGenerate) {
      this.push(null)
    }

    this.timer = null
  }, this.timeout)
}
// -- RandomStream End --

const req = http.request('http://localhost:8081/upload', {
  method: 'POST'
}, (res) => {
  console.log(`{CLIENT} STATUS: ${res.statusCode}`)
  console.log(`{CLIENT} HEADERS: ${JSON.stringify(res.headers)}`)
})

req.on('error', (e) => {
  console.error('{CLIENT}', e)
})

console.log(`{CLIENT} Running on node ${process.version}`)

// const OK = { size: 16384 * 10 , timeout: 500 }
// const bodyStream = new RandomStream(OK.size, null, OK.timeout)

// NOTE: 130 ticks at 500ms should exceed 60s
const FAIL = { size: 16384 * 130, timeout: 500 } 
const bodyStream = new RandomStream(FAIL.size, null, FAIL.timeout)

// NOTE: fails at 'duration' of >84s
// const FAIL_SLOWER = { size: 16384 * 10 , timeout: 1000 * 14 } 
// const bodyStream = new RandomStream(FAIL_SLOWER.size, null, FAIL_SLOWER.timeout)

bodyStream.pipe(req)
