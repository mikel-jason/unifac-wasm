const express = require('express')
const app = express()
const port = 8080

const options = {
    setHeaders: function (res, path, stat) {
        res.set('Cross-Origin-Embedder-Policy', 'require-corp')
        res.set('Cross-Origin-Opener-Policy', 'same-origin')
    }
  }
  
  app.use(express.static('.', options))


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})